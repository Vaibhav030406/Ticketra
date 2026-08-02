package com.devtiro.tickets.services.impl;

import com.devtiro.tickets.domain.CreateOrderRequest;
import com.devtiro.tickets.domain.entities.Event;
import com.devtiro.tickets.domain.entities.EventStatusEnum;
import com.devtiro.tickets.domain.entities.Order;
import com.devtiro.tickets.domain.entities.OrderStatusEnum;
import com.devtiro.tickets.domain.entities.Ticket;
import com.devtiro.tickets.domain.entities.TicketStatusEnum;
import com.devtiro.tickets.domain.entities.TicketType;
import com.devtiro.tickets.domain.entities.User;
import com.devtiro.tickets.exceptions.DuplicateOrderException;
import com.devtiro.tickets.exceptions.InvalidOrderException;
import com.devtiro.tickets.exceptions.InvalidWebhookSignatureException;
import com.devtiro.tickets.exceptions.TicketTypeNotFoundException;
import com.devtiro.tickets.exceptions.TicketsSoldOutException;
import com.devtiro.tickets.exceptions.UserNotFoundException;
import com.devtiro.tickets.repositories.OrderRepository;
import com.devtiro.tickets.repositories.TicketRepository;
import com.devtiro.tickets.repositories.TicketTypeRepository;
import com.devtiro.tickets.repositories.UserRepository;
import com.devtiro.tickets.services.OrderService;
import com.devtiro.tickets.services.QrCodeService;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderServiceImpl implements OrderService {

  private static final int MAX_TICKETS_PER_ORDER = 5;

  private final UserRepository userRepository;
  private final TicketTypeRepository ticketTypeRepository;
  private final TicketRepository ticketRepository;
  private final OrderRepository orderRepository;
  private final RazorpayClient razorpayClient;
  private final QrCodeService qrCodeService;

  @Value("${razorpay.webhook.secret}")
  private String webhookSecret;

  @Override
  @Transactional
  public Order createOrder(UUID userId, CreateOrderRequest request) {
    LocalDateTime now = LocalDateTime.now();

    // 1. Validate Quantity Cap
    if (request.getQuantity() > MAX_TICKETS_PER_ORDER) {
      throw new InvalidOrderException("A maximum of 5 tickets can be purchased per order");
    }

    User purchaser = userRepository.findById(userId)
        .orElseThrow(() -> new UserNotFoundException(
            String.format("User with ID %s was not found", userId)
        ));

    // Pessimistically lock TicketType to prevent race conditions during availability check
    TicketType ticketType = ticketTypeRepository.findByIdWithLock(request.getTicketTypeId())
        .orElseThrow(() -> new TicketTypeNotFoundException(
            String.format("Ticket type with ID %s was not found", request.getTicketTypeId())
        ));

    Event event = ticketType.getEvent();

    // 2. Validate Event Status
    if (event.getStatus() != EventStatusEnum.PUBLISHED) {
      throw new InvalidOrderException("Tickets cannot be purchased for an event that is not published");
    }

    // 3. Validate Sales Window
    if (event.getSalesStart() != null && now.isBefore(event.getSalesStart())) {
      throw new InvalidOrderException("Ticket sales for this event have not started yet");
    }
    if (event.getSalesEnd() != null && now.isAfter(event.getSalesEnd())) {
      throw new InvalidOrderException("Ticket sales for this event have ended");
    }

    // 4. Validate Idempotency Key (fail-fast pre-check)
    if (orderRepository.existsByIdempotencyKey(request.getIdempotencyKey())) {
      throw new DuplicateOrderException(
          String.format("An order with idempotency key %s already exists", request.getIdempotencyKey())
      );
    }

    // 5. Validate Ticket Stock Availability
    int issuedTickets = ticketRepository.countByTicketTypeId(ticketType.getId());
    int activePendingOrderStock = orderRepository.sumQuantityByTicketTypeIdAndStatusAndExpiresAtAfter(
        ticketType.getId(),
        OrderStatusEnum.PENDING,
        now
    );
    int totalHeld = issuedTickets + activePendingOrderStock;

    if (totalHeld + request.getQuantity() > ticketType.getTotalAvailable()) {
      throw new TicketsSoldOutException();
    }

    // 6. Create Order Entity (pending state)
    double unitPrice = ticketType.getPrice();
    double totalAmount = unitPrice * request.getQuantity();

    Order order = Order.builder()
        .purchaser(purchaser)
        .ticketType(ticketType)
        .quantity(request.getQuantity())
        .unitPrice(unitPrice)
        .totalAmount(totalAmount)
        .status(OrderStatusEnum.PENDING)
        .idempotencyKey(request.getIdempotencyKey())
        .expiresAt(now.plusMinutes(10))
        .build();

    // Save temporary order to generate UUID id.
    // Use saveAndFlush + try-catch to safely handle concurrent TOCTOU race conditions.
    Order savedOrder;
    try {
      savedOrder = orderRepository.saveAndFlush(order);
    } catch (org.springframework.dao.DataIntegrityViolationException e) {
      throw new DuplicateOrderException(
          String.format("An order with idempotency key %s already exists", request.getIdempotencyKey()), e
      );
    }

    // 7. Call Razorpay to create order
    try {
      JSONObject orderRequest = new JSONObject();
      // Razorpay expects amount in paise (1 INR = 100 paise) - Round safely to avoid floating-point undercharges
      orderRequest.put("amount", (int) Math.round(totalAmount * 100));
      orderRequest.put("currency", "INR");
      orderRequest.put("receipt", savedOrder.getId().toString());

      com.razorpay.Order razorpayOrder = razorpayClient.orders.create(orderRequest);
      String razorpayOrderId = razorpayOrder.get("id");

      savedOrder.setRazorpayOrderId(razorpayOrderId);

      return orderRepository.save(savedOrder);
    } catch (RazorpayException e) {
      log.error("Failed to create order on Razorpay for Order ID: {}", savedOrder.getId(), e);
      throw new InvalidOrderException("Unable to create Razorpay payment order: " + e.getMessage(), e);
    }
  }

  @Override
  @Transactional
  public void handleRazorpayWebhook(String rawPayload, String signature) {
    try {
      Utils.verifyWebhookSignature(rawPayload, signature, webhookSecret);
    } catch (Exception e) {
      log.error("Razorpay webhook signature verification failed", e);
      throw new InvalidWebhookSignatureException("Webhook signature verification failed", e);
    }

    JSONObject payload = new JSONObject(rawPayload);
    String event = payload.optString("event");

    // Defensive, null-safe navigation — a malformed/unexpected payload should
    // never throw an NPE and take the whole handler down.
    JSONObject payloadContainer = payload.optJSONObject("payload");
    JSONObject paymentContainer =
        payloadContainer != null ? payloadContainer.optJSONObject("payment") : null;
    JSONObject paymentEntity =
        paymentContainer != null ? paymentContainer.optJSONObject("entity") : null;

    if (paymentEntity == null) {
      log.warn("Received Razorpay webhook with no payment entity, event: {}", event);
      return;
    }

    String razorpayOrderId = paymentEntity.optString("order_id");
    String razorpayPaymentId = paymentEntity.optString("id");

    if (razorpayOrderId == null || razorpayOrderId.isBlank()) {
      log.warn("Razorpay webhook payment entity missing order_id, event: {}", event);
      return;
    }

    Optional<Order> orderOpt = orderRepository.findByRazorpayOrderIdWithLock(razorpayOrderId);
    if (orderOpt.isEmpty()) {
      log.warn("No order found for Razorpay order ID: {}. Event: {}", razorpayOrderId, event);
      return;
    }

    Order order = orderOpt.get();

    // Idempotency: a terminal-state order has already been fully processed by
    // an earlier delivery of this (or another) webhook event. Razorpay both
    // retries on non-2xx responses and can send duplicate events, so this
    // check is what prevents double-issuing tickets.
    if (order.getStatus() == OrderStatusEnum.PAID || order.getStatus() == OrderStatusEnum.FAILED) {
      log.info("Order {} already in terminal state {}, ignoring webhook event {}",
          order.getId(), order.getStatus(), event);
      return;
    }

    switch (event) {
      case "payment.captured" -> handlePaymentCaptured(order, razorpayPaymentId);
      case "payment.failed" -> handlePaymentFailed(order);
      default -> log.info("Ignoring unhandled Razorpay webhook event: {}", event);
    }
  }

  private void handlePaymentCaptured(Order order, String razorpayPaymentId) {
    order.setStatus(OrderStatusEnum.PAID);
    order.setRazorpayPaymentId(razorpayPaymentId);

    // One Ticket (and one QR code) per unit of quantity — each attendee in a
    // group purchase gets their own scannable ticket at the door.
    for (int i = 0; i < order.getQuantity(); i++) {
      Ticket ticket = new Ticket();
      ticket.setStatus(TicketStatusEnum.PURCHASED);
      ticket.setTicketType(order.getTicketType());
      ticket.setPurchaser(order.getPurchaser());
      ticket.setOrder(order);

      Ticket savedTicket = ticketRepository.save(ticket);
      qrCodeService.generateQrCode(savedTicket);
    }

    orderRepository.save(order);
  }

  private void handlePaymentFailed(Order order) {
    order.setStatus(OrderStatusEnum.FAILED);
    orderRepository.save(order);
  }
}
