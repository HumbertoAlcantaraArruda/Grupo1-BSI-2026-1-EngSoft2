package agape.util;

import java.util.ArrayList;
import java.util.List;

public class ResponseObject {
    public static final String STATUS_OK = "ok";
    public static final String STATUS_FAIL = "fail";
    public static final String STATUS_FAILED = "fail";
    public static final int CODE_OK = 200;
    public static final int CODE_ERROR = 500;
    public static final int CODE_FAILED = 500;
    public static final int CODE_NOT_FOUND = 404;

    private String status;
    private int code;
    private List<String> messages = new ArrayList<>();
    private Object result;

    public ResponseObject() {
        this.status = STATUS_OK;
        this.code = CODE_OK;
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getCode() { return code; }
    public void setCode(int code) { this.code = code; }
    public List<String> getMessages() { return messages; }
    public void addMessage(String message) { this.messages.add(message); }
    public Object getResult() { return result; }
    public void setResult(Object result) { this.result = result; }

    public String toJson() {
        StringBuilder json = new StringBuilder();
        json.append("{");
        json.append("\"status\":\"").append(status).append("\",");
        json.append("\"code\":").append(code).append(",");
        
        json.append("\"messages\":[");
        for (int i = 0; i < messages.size(); i++) {
            json.append("\"").append(messages.get(i).replace("\"", "\\\"")).append("\"");
            if (i < messages.size() - 1) json.append(",");
        }
        json.append("],");

        if (result == null) {
            json.append("\"result\":null");
        } else {
            // Tenta usar o toJson do objeto, se falhar ou não tiver, limpa a string
            try {
                var metodo = result.getClass().getMethod("toJson");
                json.append("\"result\":").append(metodo.invoke(result));
            } catch (Exception e) {
                String str = String.valueOf(result)
                    .replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\n", "\\n")
                    .replace("\r", "\\r")
                    .replace("\t", "\\t");
                json.append("\"result\":\"").append(str).append("\"");
            }
        }

        json.append("}");
        return json.toString();
    }
}