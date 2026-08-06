package com.devtiro.tickets.services.impl;

import com.devtiro.tickets.domain.CreatedKeycloakUser;
import com.devtiro.tickets.domain.entities.Event;
import com.devtiro.tickets.domain.entities.EventStaff;
import com.devtiro.tickets.domain.entities.EventStaffStatusEnum;
import com.devtiro.tickets.domain.entities.User;
import com.devtiro.tickets.exceptions.DuplicateStaffInviteException;
import com.devtiro.tickets.exceptions.EventNotFoundException;
import com.devtiro.tickets.exceptions.UserNotFoundException;
import com.devtiro.tickets.repositories.EventRepository;
import com.devtiro.tickets.repositories.EventStaffRepository;
import com.devtiro.tickets.repositories.UserRepository;
import com.devtiro.tickets.services.EventStaffService;
import com.devtiro.tickets.services.KeycloakAdminService;
import com.devtiro.tickets.services.NotificationService;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventStaffServiceImpl implements EventStaffService {

  private final EventRepository eventRepository;
  private final EventStaffRepository eventStaffRepository;
  private final UserRepository userRepository;
  private final KeycloakAdminService keycloakAdminService;
  private final NotificationService notificationService;

  @Override
  @Transactional
  public EventStaff inviteStaff(UUID organizerId, UUID eventId, String staffEmail) {
    // Ownership check — identical pattern to EventServiceImpl. An organizer
    // can only invite staff for events they actually own.
    Event event = eventRepository.findByIdAndOrganizerId(eventId, organizerId)
        .orElseThrow(() -> new EventNotFoundException(
            String.format("Event with ID '%s' does not exist", eventId)
        ));

    Optional<User> existingUser = userRepository.findByEmail(staffEmail);

    if (existingUser.isPresent() && eventStaffRepository.existsByEventIdAndUserIdAndStatus(
        eventId, existingUser.get().getId(), EventStaffStatusEnum.ACTIVE)) {
      throw new DuplicateStaffInviteException(
          String.format("%s is already a staff member for this event", staffEmail)
      );
    }

    User staffUser = null;
    EventStaffStatusEnum status;

    if (existingUser.isPresent()) {
      staffUser = existingUser.get();
      status = EventStaffStatusEnum.ACTIVE;
      keycloakAdminService.assignRealmRole(staffUser.getId(), "STAFF");
      notificationService.sendStaffAddedEmail(staffEmail, event);
    } else {
      status = EventStaffStatusEnum.INVITED;
      notificationService.sendStaffAddedEmail(staffEmail, event);
    }

    User invitedBy = userRepository.findById(organizerId)
        .orElseThrow(() -> new UserNotFoundException(
            String.format("User with ID %s was not found", organizerId)
        ));

    EventStaff eventStaff = EventStaff.builder()
        .event(event)
        .user(staffUser)
        .invitedEmail(staffEmail)
        .invitedBy(invitedBy)
        .status(status)
        .build();

    return eventStaffRepository.save(eventStaff);
  }

  @Override
  public List<EventStaff> listStaff(UUID organizerId, UUID eventId) {
    Event event = eventRepository.findByIdAndOrganizerId(eventId, organizerId)
        .orElseThrow(() -> new EventNotFoundException(
            String.format("Event with ID '%s' does not exist", eventId)
        ));

    return eventStaffRepository.findByEventId(event.getId()).stream()
        .filter(es -> es.getStatus() != EventStaffStatusEnum.REVOKED)
        .toList();
  }

  @Override
  @Transactional
  public void removeStaff(UUID organizerId, UUID eventId, UUID staffUserId) {
    Event event = eventRepository.findByIdAndOrganizerId(eventId, organizerId)
        .orElseThrow(() -> new EventNotFoundException(
            String.format("Event with ID '%s' does not exist", eventId)
        ));

    eventStaffRepository.findByEventId(event.getId()).stream()
        .filter(es -> (es.getUser() != null && staffUserId.equals(es.getUser().getId()))
            || staffUserId.equals(es.getId()))
        .findFirst()
        .ifPresent(es -> {
          es.setStatus(EventStaffStatusEnum.REVOKED);
          eventStaffRepository.save(es);
        });
  }
}
