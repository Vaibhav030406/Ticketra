package com.devtiro.tickets.services;

import com.devtiro.tickets.domain.entities.EventStaff;
import java.util.List;
import java.util.UUID;

public interface EventStaffService {

  EventStaff inviteStaff(UUID organizerId, UUID eventId, String staffEmail);

  List<EventStaff> listStaff(UUID organizerId, UUID eventId);

  void removeStaff(UUID organizerId, UUID eventId, UUID staffUserId);
}
