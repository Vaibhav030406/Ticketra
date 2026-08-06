package com.devtiro.tickets.services.impl;

import com.devtiro.tickets.domain.entities.EventStaffStatusEnum;
import com.devtiro.tickets.domain.entities.QrCode;
import com.devtiro.tickets.domain.entities.QrCodeStatusEnum;
import com.devtiro.tickets.domain.entities.Ticket;
import com.devtiro.tickets.domain.entities.TicketValidation;
import com.devtiro.tickets.domain.entities.TicketValidationMethod;
import com.devtiro.tickets.domain.entities.TicketValidationStatusEnum;
import com.devtiro.tickets.domain.entities.User;
import com.devtiro.tickets.exceptions.NotEventStaffException;
import com.devtiro.tickets.exceptions.QrCodeNotFoundException;
import com.devtiro.tickets.exceptions.TicketNotFoundException;
import com.devtiro.tickets.exceptions.UserNotFoundException;
import com.devtiro.tickets.repositories.EventStaffRepository;
import com.devtiro.tickets.repositories.QrCodeRepository;
import com.devtiro.tickets.repositories.TicketRepository;
import com.devtiro.tickets.repositories.TicketValidationRepository;
import com.devtiro.tickets.repositories.UserRepository;
import com.devtiro.tickets.services.TicketValidationService;
import jakarta.transaction.Transactional;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Transactional
public class TicketValidationServiceImpl implements TicketValidationService {

  private final QrCodeRepository qrCodeRepository;
  private final TicketValidationRepository ticketValidationRepository;
  private final TicketRepository ticketRepository;
  private final UserRepository userRepository;
  private final EventStaffRepository eventStaffRepository;

  @Override
  public TicketValidation validateTicketByQrCode(UUID staffUserId, UUID qrCodeId) {
    QrCode qrCode = qrCodeRepository.findByIdAndStatus(qrCodeId, QrCodeStatusEnum.ACTIVE)
        .orElseThrow(() -> new QrCodeNotFoundException(
            String.format(
                "QR Code with ID %s was not found", qrCodeId
            )
        ));

    Ticket ticket = qrCode.getTicket();

    return validateTicket(staffUserId, ticket, TicketValidationMethod.QR_SCAN);
  }

  @Override
  public TicketValidation validateTicketManually(UUID staffUserId, UUID ticketId) {
    Ticket ticket = ticketRepository.findById(ticketId)
        .orElseThrow(TicketNotFoundException::new);
    return validateTicket(staffUserId, ticket, TicketValidationMethod.MANUAL);
  }

  private TicketValidation validateTicket(UUID staffUserId, Ticket ticket,
      TicketValidationMethod ticketValidationMethod) {
    User staff = userRepository.findById(staffUserId)
        .orElseThrow(() -> new UserNotFoundException(
            String.format("User with ID %s was not found", staffUserId)
        ));

    // The actual per-event authorization check. Holding a STAFF realm role
    // in the JWT only proves this person is staff-capable somewhere on the
    // platform — it says nothing about which event. This is what actually
    // scopes access down to the event the scanned ticket belongs to.
    UUID eventId = ticket.getTicketType().getEvent().getId();
    boolean isOrganizerOfThisEvent = ticket.getTicketType().getEvent().getOrganizer().getId().equals(staffUserId);
    boolean isStaffForThisEvent = isOrganizerOfThisEvent || eventStaffRepository.existsByEventIdAndUserIdAndStatus(
        eventId, staffUserId, EventStaffStatusEnum.ACTIVE
    );

    if (!isStaffForThisEvent) {
      throw new NotEventStaffException(
          "You are not authorized to validate tickets for this event"
      );
    }

    // Look for an existing VALID scan on this ticket. If one exists, this
    // new attempt is a duplicate and must be rejected — but we keep hold of
    // the original so the staff member scanning it now can see exactly when
    // and by whom this ticket was already checked in.
    Optional<TicketValidation> existingValidScan = ticket.getValidations().stream()
        .filter(v -> TicketValidationStatusEnum.VALID.equals(v.getStatus()))
        .findFirst();

    TicketValidation ticketValidation = new TicketValidation();
    ticketValidation.setTicket(ticket);
    ticketValidation.setValidationMethod(ticketValidationMethod);
    ticketValidation.setValidatedBy(staff);
    ticketValidation.setStatus(
        existingValidScan.isPresent() ? TicketValidationStatusEnum.INVALID
            : TicketValidationStatusEnum.VALID
    );

    TicketValidation saved = ticketValidationRepository.save(ticketValidation);

    existingValidScan.ifPresent(original -> {
      saved.setOriginalValidationContext(original);
    });

    return saved;
  }
}
