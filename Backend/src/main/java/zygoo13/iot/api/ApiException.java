package zygoo13.iot.api;

import org.springframework.http.HttpStatus;

public class ApiException extends RuntimeException {
    private final HttpStatus status;
    private final String code;
    private final Long requestId;

    public ApiException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
        this.requestId = null;
    }

    public ApiException(HttpStatus status, String code, String message, Long requestId) {
        super(message);
        this.status = status;
        this.code = code;
        this.requestId = requestId;
    }

    public HttpStatus getStatus() { return status; }
    public String getCode() { return code; }
    public Long getRequestId() { return requestId; }
}
