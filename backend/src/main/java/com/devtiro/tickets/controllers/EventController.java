package com.devtiro.tickets.controllers;

import static com.devtiro.tickets.util.JwtUtil.parseUserId;

import com.devtiro.tickets.domain.CreateEventRequest;
import com.devtiro.tickets.domain.UpdateEventRequest;
import com.devtiro.tickets.domain.dtos.CreateEventRequestDto;
import com.devtiro.tickets.domain.dtos.CreateEventResponseDto;
import com.devtiro.tickets.domain.dtos.GetEventDetailsResponseDto;
import com.devtiro.tickets.domain.dtos.ListEventResponseDto;
import com.devtiro.tickets.domain.dtos.UpdateEventRequestDto;
import com.devtiro.tickets.domain.dtos.UpdateEventResponseDto;
import com.devtiro.tickets.domain.entities.Event;
import com.devtiro.tickets.mappers.EventMapper;
import com.devtiro.tickets.services.EventService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1/events")
@RequiredArgsConstructor
public class EventController {

  private final EventMapper eventMapper;
  private final EventService eventService;

  @PostMapping
  public ResponseEntity<CreateEventResponseDto> createEvent(
      @AuthenticationPrincipal Jwt jwt,
      @Valid @RequestBody CreateEventRequestDto createEventRequestDto) {
    CreateEventRequest createEventRequest = eventMapper.fromDto(createEventRequestDto);
    UUID userId = parseUserId(jwt);

    Event createdEvent = eventService.createEvent(userId, createEventRequest);
    CreateEventResponseDto createEventResponseDto = eventMapper.toDto(createdEvent);
    return new ResponseEntity<>(createEventResponseDto, HttpStatus.CREATED);
  }

  @PutMapping(path = "/{eventId}")
  public ResponseEntity<UpdateEventResponseDto> updateEvent(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID eventId,
      @Valid @RequestBody UpdateEventRequestDto updateEventRequestDto) {
    UpdateEventRequest updateEventRequest = eventMapper.fromDto(updateEventRequestDto);
    UUID userId = parseUserId(jwt);

    Event updatedEvent = eventService.updateEventForOrganizer(
        userId, eventId, updateEventRequest
    );

    UpdateEventResponseDto updateEventResponseDto = eventMapper.toUpdateEventResponseDto(
        updatedEvent);

    return ResponseEntity.ok(updateEventResponseDto);
  }

  @GetMapping
  public ResponseEntity<Page<ListEventResponseDto>> listEvents(
      @AuthenticationPrincipal Jwt jwt, Pageable pageable
  ) {
    UUID userId = parseUserId(jwt);
    Page<Event> events = eventService.listEventsForOrganizer(userId, pageable);
    return ResponseEntity.ok(
        events.map(eventMapper::toListEventResponseDto)
    );
  }

  @GetMapping(path = "/{eventId}")
  public ResponseEntity<GetEventDetailsResponseDto> getEvent(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID eventId
  ) {
    UUID userId = parseUserId(jwt);
    return eventService.getEventForOrganizer(userId, eventId)
        .map(eventMapper::toGetEventDetailsResponseDto)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
  }

  @DeleteMapping(path = "/{eventId}")
  public ResponseEntity<Void> deleteEvent(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID eventId
  ) {
    UUID userId = parseUserId(jwt);
    eventService.deleteEventForOrganizer(userId, eventId);
    return ResponseEntity.noContent().build();
  }

  @PostMapping(path = "/{eventId}/staff")
  public ResponseEntity<com.devtiro.tickets.domain.dtos.StaffUserResponseDto> addStaff(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID eventId,
      @Valid @RequestBody com.devtiro.tickets.domain.dtos.AddStaffRequestDto addStaffRequestDto) {
    UUID userId = parseUserId(jwt);
    Event updatedEvent = eventService.addStaffToEvent(userId, eventId, addStaffRequestDto.getEmail());

    com.devtiro.tickets.domain.entities.User addedStaff = updatedEvent.getStaff().stream()
        .filter(u -> u.getEmail().equalsIgnoreCase(addStaffRequestDto.getEmail()))
        .findFirst()
        .orElseThrow();

    return ResponseEntity.status(HttpStatus.CREATED)
        .body(new com.devtiro.tickets.domain.dtos.StaffUserResponseDto(
            addedStaff.getId(), addedStaff.getName(), addedStaff.getEmail()));
  }

  @DeleteMapping(path = "/{eventId}/staff/{staffUserId}")
  public ResponseEntity<Void> removeStaff(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID eventId,
      @PathVariable UUID staffUserId) {
    UUID userId = parseUserId(jwt);
    eventService.removeStaffFromEvent(userId, eventId, staffUserId);
    return ResponseEntity.noContent().build();
  }

  @GetMapping(path = "/{eventId}/staff")
  public ResponseEntity<java.util.List<com.devtiro.tickets.domain.dtos.StaffUserResponseDto>> listStaff(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID eventId) {
    UUID userId = parseUserId(jwt);
    java.util.List<com.devtiro.tickets.domain.entities.User> staffList = eventService.listStaffForEvent(userId, eventId);
    java.util.List<com.devtiro.tickets.domain.dtos.StaffUserResponseDto> response = staffList.stream()
        .map(u -> new com.devtiro.tickets.domain.dtos.StaffUserResponseDto(u.getId(), u.getName(), u.getEmail()))
        .toList();
    return ResponseEntity.ok(response);
  }
}
