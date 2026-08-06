package com.devtiro.tickets.domain.dtos;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketTypeSalesDto {

  private UUID ticketTypeId;
  private String ticketTypeName;
  private Double price;
  private Integer totalAvailable;
  private Integer soldCount;
  private Integer remainingCapacity;
  private Double revenue;
}
