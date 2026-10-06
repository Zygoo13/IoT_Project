package zygoo13.iot.ws;

import java.util.List;
import java.util.Set;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;
import zygoo13.iot.repository.UserRepository;

@Component
public class StompAuthInterceptor implements ChannelInterceptor {
    private static final Set<String> TOPICS = Set.of(
            "/topic/sensors", "/topic/hardware", "/topic/devices", "/topic/notifications");

    private final JwtDecoder jwtDecoder;
    private final UserRepository users;

    public StompAuthInterceptor(JwtDecoder jwtDecoder, UserRepository users) {
        this.jwtDecoder = jwtDecoder;
        this.users = users;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor headers = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (headers == null) {
            return message;
        }
        StompCommand command = headers.getCommand();
        if (command == StompCommand.CONNECT) {
            String authorization = headers.getFirstNativeHeader("Authorization");
            if (authorization == null || !authorization.startsWith("Bearer ")) {
                throw new MessagingException("STOMP authentication required");
            }
            try {
                Jwt jwt = jwtDecoder.decode(authorization.substring(7));
                Long userId = Long.valueOf(jwt.getSubject());
                if (!users.existsById(userId)) {
                    throw new MessagingException("STOMP authentication required");
                }
                headers.setUser(new UsernamePasswordAuthenticationToken(
                        userId.toString(), null, List.of()));
            } catch (JwtException | NumberFormatException error) {
                throw new MessagingException("STOMP authentication required");
            }
        } else if (command == StompCommand.DISCONNECT) {
            return message; // The server also creates this frame while closing a rejected session.
        } else if (command != null) {
            if (headers.getUser() == null) {
                throw new MessagingException("STOMP authentication required");
            }
            if (command == StompCommand.SUBSCRIBE &&
                    (headers.getDestination() == null || !TOPICS.contains(headers.getDestination()))) {
                throw new MessagingException("STOMP subscription not allowed");
            }
            if (command == StompCommand.SEND) {
                throw new MessagingException("Client STOMP messages are not allowed");
            }
        }
        return message;
    }
}
