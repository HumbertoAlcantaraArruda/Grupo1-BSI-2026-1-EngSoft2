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

    private int code;
    private String status;
    private List<String> messages;
    private Object result;

    // CONSTRUTOR
    public ResponseObject() {

        this.messages = new ArrayList<>();
    }

    // GETTERS E SETTERS

    public int getCode() {
        return code;
    }

    public void setCode(int code) {
        this.code = code;
    }

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


    public String toJson() {
        StringBuilder json = new StringBuilder();
        json.append("{");
        json.append("\"status\":\"").append(status).append("\",");

        // Messages
        json.append("\"messages\":[");
        for (int i = 0; i < messages.size(); i++) {
            json.append("\"").append(messages.get(i)).append("\"");
            if (i < messages.size() - 1)
                json.append(",");
        }
        json.append("],");

        // Result — verifica se o objeto tem toJson()
        if (result == null) {
            json.append("\"result\":null");
        } else if (result instanceof String) {
            json.append("\"result\":\"").append(result).append("\"");
        } else if (result instanceof Number || result instanceof Boolean) {
            json.append("\"result\":").append(result);
        } else {
            // Tenta chamar toJson() do objeto via reflection
            try {
                var metodo = result.getClass().getMethod("toJson");
                json.append("\"result\":").append(metodo.invoke(result));
            } catch (Exception e) {
                // Se não tiver toJson, envia o toString mas escapando aspas
                String str = String.valueOf(result).replace("\"", "\\\"");
                json.append("\"result\":\"").append(str).append("\"");
            }
        }

        json.append("}");
        return json.toString();
    }

}