package com.devtiro.tickets.services.impl;

import com.devtiro.tickets.domain.entities.QrCode;
import com.devtiro.tickets.domain.entities.QrCodeStatusEnum;
import com.devtiro.tickets.domain.entities.Ticket;
import com.devtiro.tickets.domain.entities.TicketValidation;
import com.devtiro.tickets.domain.entities.TicketValidationMethod;
import com.devtiro.tickets.domain.entities.TicketValidationStatusEnum;
import com.devtiro.tickets.domain.entities.User;
import com.devtiro.tickets.exceptions.QrCodeNotFoundException;
import com.devtiro.tickets.exceptions.TicketNotFoundException;
import com.devtiro.tickets.exceptions.UserNotFoundException;
import com.devtiro.tickets.repositories.QrCodeRepository;
import com.devtiro.tickets.repositories.TicketRepository;
import com.devtiro.tickets.repositories.TicketValidationRepository;
import com.devtiro.tickets.repositories.UserRepository;
import com.devtiro.tickets.services.TicketValidationService;
import jakarta.transaction.Transactional;
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

  private TicketValidation validateTicket(UUID staffUserId, Ticket ticket,
      TicketValidationMethod ticketValidationMethod) {
    User staffUser = userRepository.findById(staffUserId)
        .orElseThrow(() -> new UserNotFoundException(
            String.format("User with ID %s was not found", staffUserId)
        ));

    // Verify staff assignment if event has explicit staff assigned
    if (ticket.getTicketType() != null && ticket.getTicketType().getEvent() != null) {
      com.devtiro.tickets.domain.entities.Event event = ticket.getTicketType().getEvent();
      if (!event.getStaff().isEmpty() && !event.getStaff().contains(staffUser)) {
        throw new com.devtiro.tickets.exceptions.StaffNotAssignedToEventException(
            String.format("You are not assigned as gate staff for event '%s'", event.getName())
        );
      }
    }

    TicketValidation ticketValidation = new TicketValidation();
    ticketValidation.setTicket(ticket);
    ticketValidation.setValidationMethod(ticketValidationMethod);
    ticketValidation.setValidatedBy(staffUser);

    TicketValidationStatusEnum ticketValidationStatus = ticket.getValidations().stream()
        .filter(v -> TicketValidationStatusEnum.VALID.equals(v.getStatus()))
        .findFirst()
        .map(v -> {
          ticketValidation.setOriginalValidationContext(v);
          return TicketValidationStatusEnum.INVALID;
        })
        .orElse(TicketValidationStatusEnum.VALID);

    ticketValidation.setStatus(ticketValidationStatus);

    return ticketValidationRepository.save(ticketValidation);
  }

  @Override
  public TicketValidation validateTicketManually(UUID staffUserId, UUID ticketId) {
    Ticket ticket = ticketRepository.findById(ticketId)
        .orElseThrow(TicketNotFoundException::new);
    return validateTicket(staffUserId, ticket, TicketValidationMethod.MANUAL);
  }
}
