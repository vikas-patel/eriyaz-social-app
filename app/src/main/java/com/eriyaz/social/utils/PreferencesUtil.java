/*
 * Copyright 2017 Rozdoum
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

package com.eriyaz.social.utils;

import android.content.Context;
import android.content.SharedPreferences;

public class PreferencesUtil {

    private static final String TAG = PreferencesUtil.class.getSimpleName();

    private static final String SHARED_PREFERENCES_NAME = "com.eriyaz.social";
    private static final String PREF_PARAM_IS_PROFILE_CREATED = "isProfileCreated";
    private static final String PREF_PARAM_IS_POSTS_WAS_LOADED_AT_LEAST_ONCE = "isPostsWasLoadedAtLeastOnce";
    private static final String PREF_PARAM_IS_USER_RATED_AT_LEAST_ONCE = "isUserRatedAtLeastOnce";
    private static final String PREF_PARAM_IS_USER_VIEWED_RATING_AT_LEAST_ONCE = "isUserViewedRatingAtLeastOnce";

    private static SharedPreferences getSharedPreferences(Context context) {
        return context.getSharedPreferences(SHARED_PREFERENCES_NAME, Context.MODE_PRIVATE);
    }

    public static Boolean isProfileCreated(Context context) {
        return getSharedPreferences(context).getBoolean(PREF_PARAM_IS_PROFILE_CREATED, false);
    }

    public static Boolean isPostWasLoadedAtLeastOnce(Context context) {
        return getSharedPreferences(context).getBoolean(PREF_PARAM_IS_POSTS_WAS_LOADED_AT_LEAST_ONCE, false);
    }

    public static void setProfileCreated(Context context, Boolean isProfileCreated) {
        getSharedPreferences(context).edit().putBoolean(PREF_PARAM_IS_PROFILE_CREATED, isProfileCreated).commit();
    }

    public static void setPostWasLoadedAtLeastOnce(Context context, Boolean isPostWasLoadedAtLeastOnce) {
        getSharedPreferences(context).edit().putBoolean(PREF_PARAM_IS_POSTS_WAS_LOADED_AT_LEAST_ONCE, isPostWasLoadedAtLeastOnce).commit();
    }

    public static Boolean isUserRatedAtLeastOnce(Context context) {
        return getSharedPreferences(context).getBoolean(PREF_PARAM_IS_USER_RATED_AT_LEAST_ONCE, false);
    }

    public static void setUserRatedAtLeastOnce(Context context, Boolean isUserRatedAtLeastOnce) {
        getSharedPreferences(context).edit().putBoolean(PREF_PARAM_IS_USER_RATED_AT_LEAST_ONCE, isUserRatedAtLeastOnce).commit();
    }

    public static Boolean isUserViewedRatingAtLeastOnce(Context context) {
        return getSharedPreferences(context).getBoolean(PREF_PARAM_IS_USER_VIEWED_RATING_AT_LEAST_ONCE, false);
    }

    public static void setUserViewedRatingAtLeastOnce(Context context, Boolean isUserViewedRatingAtLeastOnce) {
        getSharedPreferences(context).edit().putBoolean(PREF_PARAM_IS_USER_VIEWED_RATING_AT_LEAST_ONCE, isUserViewedRatingAtLeastOnce).commit();
    }

    public static void clearPreferences(Context context){
        final SharedPreferences.Editor editor = getSharedPreferences(context).edit();
        editor.clear();
        editor.apply();
    }
}
