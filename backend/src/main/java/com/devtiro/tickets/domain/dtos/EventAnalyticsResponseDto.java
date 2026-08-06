package com.devtiro.tickets.domain.dtos;

import java.util.List;
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
public class EventAnalyticsResponseDto {

  private UUID eventId;
  private String eventName;
  private Double totalRevenue;
  private Integer totalSold;
  private Integer totalCapacity;
  private List<TicketTypeSalesDto> ticketTypeBreakdown;
}
