package com.devtiro.tickets.domain;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateOrderRequest {

  private UUID ticketTypeId;
  private Integer quantity;
  private String idempotencyKey;
}
