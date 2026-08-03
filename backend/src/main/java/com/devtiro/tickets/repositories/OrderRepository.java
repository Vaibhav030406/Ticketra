package com.devtiro.tickets.repositories;

import com.devtiro.tickets.domain.entities.Order;
import com.devtiro.tickets.domain.entities.OrderStatusEnum;
import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {

  boolean existsByIdempotencyKey(String idempotencyKey);

  @Query("SELECT COALESCE(SUM(o.quantity), 0) FROM CustomerOrder o WHERE o.ticketType.id = :ticketTypeId AND o.status = :status AND o.expiresAt > :now")
  int sumQuantityByTicketTypeIdAndStatusAndExpiresAtAfter(
      @Param("ticketTypeId") UUID ticketTypeId,
      @Param("status") OrderStatusEnum status,
      @Param("now") LocalDateTime now
  );

  @Query("SELECT o FROM CustomerOrder o WHERE o.razorpayOrderId = :razorpayOrderId")
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  Optional<Order> findByRazorpayOrderIdWithLock(@Param("razorpayOrderId") String razorpayOrderId);

  @Modifying
  @Transactional
  @Query("UPDATE CustomerOrder o SET o.status = :expiredStatus, o.updatedAt = :now WHERE o.status = :pendingStatus AND o.expiresAt < :now")
  int updateStatusForExpiredOrders(
      @Param("pendingStatus") OrderStatusEnum pendingStatus,
      @Param("expiredStatus") OrderStatusEnum expiredStatus,
      @Param("now") LocalDateTime now
  );
}
