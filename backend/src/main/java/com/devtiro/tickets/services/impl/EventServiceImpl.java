package com.devtiro.tickets.services.impl;

import com.devtiro.tickets.domain.CreateEventRequest;
import com.devtiro.tickets.domain.UpdateEventRequest;
import com.devtiro.tickets.domain.UpdateTicketTypeRequest;
import com.devtiro.tickets.domain.dtos.EventAnalyticsResponseDto;
import com.devtiro.tickets.domain.dtos.TicketTypeSalesDto;
import com.devtiro.tickets.domain.entities.Event;
import com.devtiro.tickets.domain.entities.EventStatusEnum;
import com.devtiro.tickets.domain.entities.Order;
import com.devtiro.tickets.domain.entities.OrderStatusEnum;
import com.devtiro.tickets.domain.entities.Ticket;
import com.devtiro.tickets.domain.entities.TicketStatusEnum;
import com.devtiro.tickets.domain.entities.TicketType;
import com.devtiro.tickets.domain.entities.User;
import com.devtiro.tickets.exceptions.EventNotFoundException;
import com.devtiro.tickets.exceptions.EventUpdateException;
import com.devtiro.tickets.exceptions.TicketTypeNotFoundException;
import com.devtiro.tickets.exceptions.UserNotFoundException;
import com.devtiro.tickets.repositories.EventRepository;
import com.devtiro.tickets.repositories.OrderRepository;
import com.devtiro.tickets.repositories.TicketRepository;
import com.devtiro.tickets.repositories.UserRepository;
import com.devtiro.tickets.services.EventService;
import com.devtiro.tickets.services.NotificationService;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import jakarta.transaction.Transactional;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventServiceImpl implements EventService {

  private final UserRepository userRepository;
  private final EventRepository eventRepository;
  private final OrderRepository orderRepository;
  private final TicketRepository ticketRepository;
  private final RazorpayClient razorpayClient;
  private final NotificationService notificationService;

  @Override
  @Transactional
  public Event createEvent(UUID organizerId, CreateEventRequest event) {
    User organizer = userRepository.findById(organizerId)
        .orElseThrow(() -> new UserNotFoundException(
            String.format("User with ID '%s' not found", organizerId))
        );

    Event eventToCreate = new Event();

    List<TicketType> ticketTypesToCreate = event.getTicketTypes().stream().map(
        ticketType -> {
          TicketType ticketTypeToCreate = new TicketType();
          ticketTypeToCreate.setName(ticketType.getName());
          ticketTypeToCreate.setPrice(ticketType.getPrice());
          ticketTypeToCreate.setDescription(ticketType.getDescription());
          ticketTypeToCreate.setTotalAvailable(ticketType.getTotalAvailable());
          ticketTypeToCreate.setEvent(eventToCreate);
          return ticketTypeToCreate;
        }).toList();

    eventToCreate.setName(event.getName());
    eventToCreate.setStart(event.getStart());
    eventToCreate.setEnd(event.getEnd());
    eventToCreate.setVenue(event.getVenue());
    eventToCreate.setSalesStart(event.getSalesStart());
    eventToCreate.setSalesEnd(event.getSalesEnd());
    eventToCreate.setStatus(event.getStatus());
    eventToCreate.setOrganizer(organizer);
    eventToCreate.setTicketTypes(ticketTypesToCreate);

    return eventRepository.save(eventToCreate);
  }

  @Override
  public Page<Event> listEventsForOrganizer(UUID organizerId, Pageable pageable) {
    return eventRepository.findByOrganizerId(organizerId, pageable);
  }

  @Override
  public Optional<Event> getEventForOrganizer(UUID organizerId, UUID id) {
    return eventRepository.findByIdAndOrganizerId(id, organizerId);
  }

  @Override
  @Transactional
  public Event updateEventForOrganizer(UUID organizerId, UUID id, UpdateEventRequest event) {
    if (null == event.getId()) {
      throw new EventUpdateException("Event ID cannot be null");
    }

    if (!id.equals(event.getId())) {
      throw new EventUpdateException("Cannot update the ID of an event");
    }

    Event existingEvent = eventRepository
        .findByIdAndOrganizerId(id, organizerId)
        .orElseThrow(() -> new EventNotFoundException(
            String.format("Event with ID '%s' does not exist", id))
        );

    existingEvent.setName(event.getName());
    existingEvent.setStart(event.getStart());
    existingEvent.setEnd(event.getEnd());
    existingEvent.setVenue(event.getVenue());
    existingEvent.setSalesStart(event.getSalesStart());
    existingEvent.setSalesEnd(event.getSalesEnd());
    existingEvent.setStatus(event.getStatus());

    Set<UUID> requestTicketTypeIds = event.getTicketTypes()
        .stream()
        .map(UpdateTicketTypeRequest::getId)
        .filter(Objects::nonNull)
        .collect(Collectors.toSet());

    existingEvent.getTicketTypes().removeIf(existingTicketType ->
        !requestTicketTypeIds.contains(existingTicketType.getId())
    );

    Map<UUID, TicketType> existingTicketTypesIndex = existingEvent.getTicketTypes().stream()
        .collect(Collectors.toMap(TicketType::getId, Function.identity()));

    for (UpdateTicketTypeRequest ticketType : event.getTicketTypes()) {
      if (null == ticketType.getId()) {
        TicketType ticketTypeToCreate = new TicketType();
        ticketTypeToCreate.setName(ticketType.getName());
        ticketTypeToCreate.setPrice(ticketType.getPrice());
        ticketTypeToCreate.setDescription(ticketType.getDescription());
        ticketTypeToCreate.setTotalAvailable(ticketType.getTotalAvailable());
        ticketTypeToCreate.setEvent(existingEvent);
        existingEvent.getTicketTypes().add(ticketTypeToCreate);

      } else if (existingTicketTypesIndex.containsKey(ticketType.getId())) {
        TicketType existingTicketType = existingTicketTypesIndex.get(ticketType.getId());
        existingTicketType.setName(ticketType.getName());
        existingTicketType.setPrice(ticketType.getPrice());
        existingTicketType.setDescription(ticketType.getDescription());
        existingTicketType.setTotalAvailable(ticketType.getTotalAvailable());
      } else {
        throw new TicketTypeNotFoundException(String.format(
            "Ticket type with ID '%s' does not exist", ticketType.getId()
        ));
      }
    }

    return eventRepository.save(existingEvent);
  }

  @Override
  @Transactional
  public void deleteEventForOrganizer(UUID organizerId, UUID id) {
    getEventForOrganizer(organizerId, id).ifPresent(eventRepository::delete);
  }

  @Override
  public Page<Event> listPublishedEvents(Pageable pageable) {
    return eventRepository.findByStatus(EventStatusEnum.PUBLISHED, pageable);
  }

  @Override
  public Page<Event> searchPublishedEvents(String query, Pageable pageable) {
    return eventRepository.searchEvents(query, pageable);
  }

  @Override
  public Optional<Event> getPublishedEvent(UUID id) {
    return eventRepository.findByIdAndStatus(id, EventStatusEnum.PUBLISHED);
  }

  @Override
  @Transactional
  public Event addStaffToEvent(UUID organizerId, UUID eventId, String staffEmail) {
    Event event = getEventForOrganizer(organizerId, eventId)
        .orElseThrow(EventNotFoundException::new);

    User staffUser = userRepository.findByEmailIgnoreCase(staffEmail)
        .orElseGet(() -> {
          User newUser = new User();
          newUser.setId(UUID.randomUUID());
          newUser.setName(staffEmail.split("@")[0]);
          newUser.setEmail(staffEmail.toLowerCase());
          return userRepository.save(newUser);
        });

    if (!event.getStaff().contains(staffUser)) {
      event.getStaff().add(staffUser);
      staffUser.getStaffingEvents().add(event);
      userRepository.save(staffUser);
      return eventRepository.save(event);
    }

    return event;
  }

  @Override
  @Transactional
  public Event removeStaffFromEvent(UUID organizerId, UUID eventId, UUID staffUserId) {
    Event event = getEventForOrganizer(organizerId, eventId)
        .orElseThrow(EventNotFoundException::new);

    User staffUser = userRepository.findById(staffUserId)
        .orElseThrow(UserNotFoundException::new);

    event.getStaff().remove(staffUser);
    staffUser.getStaffingEvents().remove(event);
    userRepository.save(staffUser);
    return eventRepository.save(event);
  }

  @Override
  public List<User> listStaffForEvent(UUID organizerId, UUID eventId) {
    Event event = getEventForOrganizer(organizerId, eventId)
        .orElseThrow(EventNotFoundException::new);
    return event.getStaff();
  }

  // -------------------------------------------------------------------------
  // Cancellation flow
  // -------------------------------------------------------------------------

  @Override
  @Transactional
  public Event cancelEvent(UUID organizerId, UUID eventId) {
    Event event = getEventForOrganizer(organizerId, eventId)
        .orElseThrow(() -> new EventNotFoundException(
            String.format("Event with ID '%s' was not found", eventId)));

    // Idempotent -- already cancelled, nothing to do.
    if (event.getStatus() == EventStatusEnum.CANCELLED) {
      log.info("Event {} is already CANCELLED, skipping.", eventId);
      return event;
    }

    // Only PUBLISHED or DRAFT events can be cancelled via this flow.
    if (event.getStatus() != EventStatusEnum.PUBLISHED
        && event.getStatus() != EventStatusEnum.DRAFT) {
      throw new EventUpdateException(
          "Only PUBLISHED or DRAFT events can be cancelled. Current status: " + event.getStatus());
    }

    // Fetch all PAID orders for this event across all ticket types.
    List<Order> paidOrders = orderRepository
        .findByTicketType_Event_IdAndStatus(eventId, OrderStatusEnum.PAID);

    log.info("Cancelling event '{}' (id={}): {} PAID order(s) to refund.",
        event.getName(), eventId, paidOrders.size());

    // Track unique attendee emails for stub notifications (deduplicated).
    Set<String> notifiedEmails = new HashSet<>();

    for (Order order : paidOrders) {
      // --- best-effort Razorpay refund ---
      try {
        JSONObject refundParams = new JSONObject();
        // Razorpay expects amount in paise (1 INR = 100 paise).
        refundParams.put("amount", (int) Math.round(order.getTotalAmount() * 100));

        razorpayClient.payments.refund(order.getRazorpayPaymentId(), refundParams);

        order.setStatus(OrderStatusEnum.REFUNDED);
        log.info("Refunded order {} (Razorpay payment {}).",
            order.getId(), order.getRazorpayPaymentId());

      } catch (RazorpayException e) {
        // Non-blocking: log the failure and mark the order so ops can retry.
        log.error("Razorpay refund failed for order {} (payment {}): {}",
            order.getId(), order.getRazorpayPaymentId(), e.getMessage(), e);
        order.setStatus(OrderStatusEnum.REFUND_FAILED);
      }

      // Cancel all tickets on this order regardless of refund outcome.
      List<Ticket> tickets = ticketRepository.findByOrderId(order.getId());
      tickets.forEach(ticket -> ticket.setStatus(TicketStatusEnum.CANCELLED));
      ticketRepository.saveAll(tickets);
      orderRepository.save(order);

      // Collect attendee email for stub notification.
      if (order.getPurchaser() != null
          && order.getPurchaser().getEmail() != null
          && notifiedEmails.add(order.getPurchaser().getEmail())) {
        notificationService.sendEventCancellationEmail(
            order.getPurchaser().getEmail(), event);
      }
    }

    event.setStatus(EventStatusEnum.CANCELLED);
    Event savedEvent = eventRepository.save(event);

    log.info("Event '{}' (id={}) successfully marked CANCELLED. {}/{} orders refunded.",
        event.getName(), eventId,
        paidOrders.stream().filter(o -> o.getStatus() == OrderStatusEnum.REFUNDED).count(),
        paidOrders.size());

    return savedEvent;
  }

  // -------------------------------------------------------------------------
  // Organizer analytics
  // -------------------------------------------------------------------------

  @Override
  public EventAnalyticsResponseDto getEventAnalytics(UUID organizerId, UUID eventId) {
    Event event = getEventForOrganizer(organizerId, eventId)
        .orElseThrow(() -> new EventNotFoundException(
            String.format("Event with ID '%s' was not found", eventId)));

    List<TicketTypeSalesDto> breakdown = new ArrayList<>();
    double totalRevenue = 0.0;
    int totalSold = 0;
    int totalCapacity = 0;

    for (TicketType ticketType : event.getTicketTypes()) {
      int sold = ticketRepository.countByTicketTypeId(ticketType.getId());
      int available = ticketType.getTotalAvailable() != null ? ticketType.getTotalAvailable() : 0;
      int remaining = Math.max(0, available - sold);
      double revenue = sold * ticketType.getPrice();

      breakdown.add(TicketTypeSalesDto.builder()
          .ticketTypeId(ticketType.getId())
          .ticketTypeName(ticketType.getName())
          .price(ticketType.getPrice())
          .totalAvailable(available)
          .soldCount(sold)
          .remainingCapacity(remaining)
          .revenue(revenue)
          .build());

      totalRevenue += revenue;
      totalSold += sold;
      totalCapacity += available;
    }

    return EventAnalyticsResponseDto.builder()
        .eventId(event.getId())
        .eventName(event.getName())
        .totalRevenue(totalRevenue)
        .totalSold(totalSold)
        .totalCapacity(totalCapacity)
        .ticketTypeBreakdown(breakdown)
        .build();
  }
}
