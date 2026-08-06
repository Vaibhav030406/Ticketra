package com.devtiro.tickets.repositories;

import com.devtiro.tickets.domain.entities.EventStaff;
import com.devtiro.tickets.domain.entities.EventStaffStatusEnum;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EventStaffRepository extends JpaRepository<EventStaff, UUID> {

  // The actual per-event authorization check used by
  // TicketValidationServiceImpl before allowing any scan.
  boolean existsByEventIdAndUserIdAndStatus(
      UUID eventId, UUID userId, EventStaffStatusEnum status);

  List<EventStaff> findByEventId(UUID eventId);

  Optional<EventStaff> findByEventIdAndInvitedEmail(UUID eventId, String invitedEmail);

  List<EventStaff> findByInvitedEmailIgnoreCase(String invitedEmail);
}
