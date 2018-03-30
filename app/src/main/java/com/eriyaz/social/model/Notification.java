package com.eriyaz.social.model;

/**
 * Created by vikas on 12/2/18.
 */

public class Notification {
    private String id;
    private String fromUserId;
    private String message;
    private long createdDate;
    private String action;
    private String extraKey;
    private String extraKeyValue;
    private boolean read;
    private boolean openPlayStore;

    public Notification() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getFromUserId() {
        return fromUserId;
    }

    public void setFromUserId(String fromUserId) {
        this.fromUserId = fromUserId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public long getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(long createdDate) {
        this.createdDate = createdDate;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getExtraKey() {
        return extraKey;
    }

    public void setExtraKey(String extraKey) {
        this.extraKey = extraKey;
    }

    public String getExtraKeyValue() {
        return extraKeyValue;
    }

    public void setExtraKeyValue(String extraKeyValue) {
        this.extraKeyValue = extraKeyValue;
    }

    public boolean isRead() {
        return read;
    }

    public void setRead(boolean read) {
        this.read = read;
    }

    public boolean isOpenPlayStore() {
        return openPlayStore;
    }

    public void setOpenPlayStore(boolean openPlayStore) {
        this.openPlayStore = openPlayStore;
    }
}