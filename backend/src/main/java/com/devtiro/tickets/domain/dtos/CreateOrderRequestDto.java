package com.devtiro.tickets.domain.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateOrderRequestDto {

  @NotNull(message = "Ticket type is required")
  private UUID ticketTypeId;

  // Only structural validation here (must be a positive number). The actual
  // per-order max-quantity cap is a business rule, enforced in
  // OrderService, not baked in as a fixed annotation here.
  @NotNull(message = "Quantity is required")
  @Positive(message = "Quantity must be at least 1")
  private Integer quantity;

  // Client-generated (e.g. a UUID created once per checkout attempt).
  // Retrying the same checkout should reuse this value so the server can
  // recognise it as the same attempt instead of creating a duplicate order.
  @NotBlank(message = "Idempotency key is required")
  private String idempotencyKey;
}
