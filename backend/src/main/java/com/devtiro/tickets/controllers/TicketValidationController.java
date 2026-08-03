package com.devtiro.tickets.controllers;

import static com.devtiro.tickets.util.JwtUtil.parseUserId;

import com.devtiro.tickets.domain.dtos.TicketValidationRequestDto;
import com.devtiro.tickets.domain.dtos.TicketValidationResponseDto;
import com.devtiro.tickets.domain.entities.TicketValidation;
import com.devtiro.tickets.domain.entities.TicketValidationMethod;
import com.devtiro.tickets.mappers.TicketValidationMapper;
import com.devtiro.tickets.services.TicketValidationService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1/ticket-validations")
@RequiredArgsConstructor
public class TicketValidationController {

  private final TicketValidationService ticketValidationService;
  private final TicketValidationMapper ticketValidationMapper;

  @PostMapping
  public ResponseEntity<TicketValidationResponseDto> validateTicket(
      @AuthenticationPrincipal Jwt jwt,
      @RequestBody TicketValidationRequestDto ticketValidationRequestDto
  ){
    UUID staffUserId = parseUserId(jwt);
    TicketValidationMethod method = ticketValidationRequestDto.getMethod();
    TicketValidation ticketValidation;
    if(TicketValidationMethod.MANUAL.equals(method)) {
      ticketValidation = ticketValidationService.validateTicketManually(
          staffUserId, ticketValidationRequestDto.getId());
    } else {
      ticketValidation = ticketValidationService.validateTicketByQrCode(
          staffUserId, ticketValidationRequestDto.getId()
      );
    }
    return ResponseEntity.ok(
        ticketValidationMapper.toTicketValidationResponseDto(ticketValidation)
    );
  }

}
