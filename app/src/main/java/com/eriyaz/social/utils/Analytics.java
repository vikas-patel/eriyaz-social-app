package com.eriyaz.social.utils;

import android.app.Activity;
import android.app.Fragment;
import android.content.Context;
import android.os.Bundle;

import com.google.firebase.analytics.FirebaseAnalytics;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;

import java.util.SimpleTimeZone;

/**
 * Created by vikas on 10/1/18.
 */

public class Analytics {

    private FirebaseAnalytics firebase;
    public static final String RATING = "rating";
    public static final String COMMENT = "comment";
    public static final String MESSAGE = "message";
    public static final String POST = "Post";
    public static final String OPEN_OTHER_AUDIO = "OpenOtherAudio";
    public static final String OPEN_SELF_AUDIO = "OpenSelfAudio";
    public static final String OPEN_RECORDED_AUDIO = "OpenRecordedAudio";
    public static final String RECORD = "Record";
    public static final String OPEN_APP_FROM_PUSH_NOTIFICATION = "OpenAppFromPushNotification";
    public static final String OPEN_POST_FROM_APP_NOTIFICATION = "OpenPostFromAppNotification";
    public static final String RECEIVED_NOTIFICATION = "ReceivedNotification";
    public static final String OPEN_NOTIFICATION_ACTIVITY = "OpenNotificationActivity";
    public static final String PLAYED_TIME = "AudioPlayedTime";
    public static final String SHARE_APP = "ShareApp";

    public Analytics(Context context) {
        firebase = FirebaseAnalytics.getInstance(context);
    }

    public void logActivity(Activity activity) {
        Bundle bundle = new Bundle();
        bundle.putString(FirebaseAnalytics.Param.ITEM_ID, activity.getClass().getSimpleName());
        firebase.logEvent(FirebaseAnalytics.Event.SELECT_CONTENT, bundle);
    }

    public void logOpenAudio(String postAuthorId) {
        Bundle bundle = new Bundle();
        FirebaseUser currentUser = FirebaseAuth.getInstance().getCurrentUser();
        if (currentUser != null) {
            bundle.putString("UserName", currentUser.getDisplayName());
            if (currentUser.getUid().equals(postAuthorId)) {
                firebase.logEvent(OPEN_SELF_AUDIO, bundle);
            } else {
                firebase.logEvent(OPEN_OTHER_AUDIO, bundle);
            }
        } else {
            // other recording
            bundle.putString("UserName", "Anonymous");
            firebase.logEvent(OPEN_OTHER_AUDIO, bundle);
        }
    }

    // log time only if played other author audio
    public void logPlayedTime(String postAuthorId, String postTitle, int playedTime) {
        Bundle bundle = new Bundle();
        FirebaseUser currentUser = FirebaseAuth.getInstance().getCurrentUser();
        if (currentUser != null && !currentUser.getUid().equals(postAuthorId)) {
            bundle.putString("UserName", currentUser.getDisplayName());
            bundle.putString("postTitle", postTitle);
            bundle.putInt("PlayTime", playedTime);
            firebase.logEvent(PLAYED_TIME, bundle);
        }
    }

    public void logOpenRecordedAudio() {
        Bundle bundle = new Bundle();
        FirebaseUser currentUser = FirebaseAuth.getInstance().getCurrentUser();
        if (currentUser != null) bundle.putString("UserName", currentUser.getDisplayName());
        firebase.logEvent(OPEN_RECORDED_AUDIO, bundle);
    }

    public void logRecording() {
        Bundle bundle = new Bundle();
        FirebaseUser currentUser = FirebaseAuth.getInstance().getCurrentUser();
        if (currentUser != null) bundle.putString("UserName", currentUser.getDisplayName());
        firebase.logEvent(RECORD, bundle);
    }

    public void logRating(int rating) {
        Bundle bundle = new Bundle();
        FirebaseUser currentUser = FirebaseAuth.getInstance().getCurrentUser();
        if (currentUser != null) bundle.putString("UserName", currentUser.getDisplayName());
        bundle.putInt("Value", rating);
        firebase.logEvent(RATING, bundle);
    }

    public void logComment() {
        Bundle bundle = new Bundle();
        FirebaseUser currentUser = FirebaseAuth.getInstance().getCurrentUser();
        if (currentUser != null) bundle.putString("UserName", currentUser.getDisplayName());
        firebase.logEvent(COMMENT, bundle);
    }

    public void logMessage() {
        Bundle bundle = new Bundle();
        FirebaseUser currentUser = FirebaseAuth.getInstance().getCurrentUser();
        if (currentUser != null) bundle.putString("UserName", currentUser.getDisplayName());
        firebase.logEvent(MESSAGE, bundle);
    }

    public void logPost() {
        Bundle bundle = new Bundle();
        FirebaseUser currentUser = FirebaseAuth.getInstance().getCurrentUser();
        if (currentUser != null) bundle.putString("UserName", currentUser.getDisplayName());
        firebase.logEvent(POST, bundle);
    }

    public void logOpenPostDetailsFromPushNotification() {
        FirebaseUser currentUser = FirebaseAuth.getInstance().getCurrentUser();
        Bundle bundle = new Bundle();
        if (currentUser != null) bundle.putString("UserName", currentUser.getDisplayName());
        firebase.logEvent(OPEN_APP_FROM_PUSH_NOTIFICATION, bundle);
    }

    public void logOpenPostDetailsFromAppNotification() {
        FirebaseUser currentUser = FirebaseAuth.getInstance().getCurrentUser();
        Bundle bundle = new Bundle();
        if (currentUser != null) bundle.putString("UserName", currentUser.getDisplayName());
        firebase.logEvent(OPEN_POST_FROM_APP_NOTIFICATION, bundle);
    }

    public void receivedNotification(String type) {
        FirebaseUser currentUser = FirebaseAuth.getInstance().getCurrentUser();
        Bundle bundle = new Bundle();
        if (currentUser != null) bundle.putString("UserName", currentUser.getDisplayName());
        bundle.putString("type", type);
        firebase.logEvent(RECEIVED_NOTIFICATION, bundle);
    }

    public void openNotificationActivity() {
        FirebaseUser currentUser = FirebaseAuth.getInstance().getCurrentUser();
        Bundle bundle = new Bundle();
        if (currentUser != null) bundle.putString("UserName", currentUser.getDisplayName());
        firebase.logEvent(OPEN_NOTIFICATION_ACTIVITY, bundle);
    }

    public void logShare() {
        Bundle bundle = new Bundle();
        FirebaseUser currentUser = FirebaseAuth.getInstance().getCurrentUser();
        if (currentUser != null) {
            bundle.putString("UserName", currentUser.getDisplayName());
        } else {
            bundle.putString("UserName", "Anonymous");
        }
        firebase.logEvent(SHARE_APP, bundle);
    }

    public void logInvite(String byUserId) {
        Bundle bundle = new Bundle();
        bundle.putString(FirebaseAnalytics.Param.ITEM_ID, "InviteAppInstall");
        bundle.putString("InvitedBy", byUserId);
        firebase.logEvent(POST, bundle);
    }

    public FirebaseAnalytics getFirebase() {
        return firebase;
    }
}