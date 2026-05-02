package agape.util;

import java.util.ArrayList;
import java.util.List;

public class ResponseObject {

    // STATUS
    public static final String STATUS_OK = "ok";
    public static final String STATUS_FAIL = "erro";

    // CÓDIGOS HTTP
    public static final int CODE_OK = 200;
    public static final int CODE_FAILED = 400;
    public static final int CODE_UNAUTHORIZED = 403;
    public static final int CODE_NOT_FOUND = 404;
    public static final int CODE_ERROR = 500;

    private String status;
    private List<String> messages;
    private Object result;

    // CONSTRUTOR
    public ResponseObject() {
        this.messages = new ArrayList<>();
    }

    // GETTERS E SETTERS
    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<String> getMessages() {
        return messages;
    }

    public void addMessage(String message) {
        this.messages.add(message);
    }

    public Object getResult() {
        return result;
    }

    public void setResult(Object result) {
        this.result = result;
    }
}