package com.devtiro.tickets.services.impl;

import com.devtiro.tickets.domain.CreateOrderRequest;
import com.devtiro.tickets.domain.entities.Event;
import com.devtiro.tickets.domain.entities.EventStatusEnum;
import com.devtiro.tickets.domain.entities.Order;
import com.devtiro.tickets.domain.entities.OrderStatusEnum;
import com.devtiro.tickets.domain.entities.TicketType;
import com.devtiro.tickets.domain.entities.User;
import com.devtiro.tickets.exceptions.DuplicateOrderException;
import com.devtiro.tickets.exceptions.InvalidOrderException;
import com.devtiro.tickets.exceptions.TicketTypeNotFoundException;
import com.devtiro.tickets.exceptions.TicketsSoldOutException;
import com.devtiro.tickets.exceptions.UserNotFoundException;
import com.devtiro.tickets.repositories.OrderRepository;
import com.devtiro.tickets.repositories.TicketRepository;
import com.devtiro.tickets.repositories.TicketTypeRepository;
import com.devtiro.tickets.repositories.UserRepository;
import com.devtiro.tickets.services.OrderService;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
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
}
