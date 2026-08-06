package com.devtiro.tickets.filters;

import com.devtiro.tickets.domain.entities.EventStaff;
import com.devtiro.tickets.domain.entities.EventStaffStatusEnum;
import com.devtiro.tickets.domain.entities.User;
import com.devtiro.tickets.repositories.EventStaffRepository;
import com.devtiro.tickets.repositories.UserRepository;
import com.devtiro.tickets.services.KeycloakAdminService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
public class UserProvisioningFilter extends OncePerRequestFilter {

  private final UserRepository userRepository;
  private final EventStaffRepository eventStaffRepository;
  private final KeycloakAdminService keycloakAdminService;

  @Override
  protected void doFilterInternal(
      HttpServletRequest request,
      HttpServletResponse response,
      FilterChain filterChain) throws ServletException, IOException {

    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

    if (authentication != null
        && authentication.isAuthenticated()
        && authentication.getPrincipal() instanceof Jwt jwt) {

      UUID keycloakId = UUID.fromString(jwt.getSubject());

      if (!userRepository.existsById(keycloakId)) {

        User user = new User();
        user.setId(keycloakId);
        user.setName(jwt.getClaimAsString("preferred_username"));
        user.setEmail(jwt.getClaimAsString("email"));

        User savedUser = userRepository.save(user);

        // Auto-claim any pending staff invitations for this user's email
        if (savedUser.getEmail() != null) {
          List<EventStaff> pendingInvites = eventStaffRepository
              .findByInvitedEmailIgnoreCase(savedUser.getEmail());
          boolean claimedAny = false;
          for (EventStaff es : pendingInvites) {
            if (es.getUser() == null || es.getStatus() == EventStaffStatusEnum.INVITED) {
              es.setUser(savedUser);
              es.setStatus(EventStaffStatusEnum.ACTIVE);
              eventStaffRepository.save(es);
              claimedAny = true;
            }
          }
          if (claimedAny) {
            keycloakAdminService.assignRealmRole(savedUser.getId(), "STAFF");
          }
        }
      }

    }

    filterChain.doFilter(request, response);
  }
}
