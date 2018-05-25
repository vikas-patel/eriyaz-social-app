var functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

const promisePool = require('es6-promise-pool');
const PromisePool = promisePool.PromisePool;
// var paytm_config = require('./paytm/paytm_config').paytm_config;
// var paytm_checksum = require('./paytm/checksum');
// const nodemailer = require('nodemailer');

const actionTypeNewRating = "new_rating"
const actionTypeNewComment = "new_comment"
const actionTypeNewPost = "new_post"
const notificationTitle = "RateMySinging"

const postsTopic = "postsTopic"
// Maximum concurrent database connection.
const MAX_CONCURRENT = 3;
const REWARD_POINTS = 20;

// const gmailEmail = functions.config().gmail.email;
// const gmailPassword = functions.config().gmail.password;
// const mailTransport = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: gmailEmail,
//     pass: gmailPassword,
//   },
// });

exports.pushNotificationRatings = functions.database.ref('/post-ratings/{postId}/{authorId}/{ratingId}').onCreate(event => {

    console.log('New rating was added');

    const ratingAuthorId = event.params.authorId;
    const postId = event.params.postId;

    // Get rated post.
    const getPostTask = admin.database().ref(`/posts/${postId}`).once('value');

    return getPostTask.then(post => {

        if (ratingAuthorId == post.val().authorId) {
            return console.log('User rated own post');
        }

        // Get the list of device notification tokens.
        const getDeviceTokensTask = admin.database().ref(`/profiles/${post.val().authorId}/notificationTokens`).once('value');
        console.log('getDeviceTokensTask path: ', `/profiles/${post.val().authorId}/notificationTokens`)

        // Get rating author.
        const getRatingAuthorProfileTask = admin.database().ref(`/profiles/${ratingAuthorId}`).once('value');

        Promise.all([getDeviceTokensTask, getRatingAuthorProfileTask]).then(results => {
            const tokensSnapshot = results[0];
            const ratingAuthorProfile = results[1].val();

            // Check if there are any device tokens.
            if (!tokensSnapshot.hasChildren()) {
                return console.log('There are no notification tokens to send to.');
            }

            console.log('There are', tokensSnapshot.numChildren(), 'tokens to send notifications to.');
            console.log('Fetched rating Author profile', ratingAuthorProfile);

            // Create a notification
            const payload = {
                data : {
                    actionType: actionTypeNewRating,
                    title: notificationTitle,
                    body: `${ratingAuthorProfile.username} rated your post`,
                    icon: post.val().imagePath,
                    postId: postId,

                },
            };

            // Listing all tokens.
            const tokens = Object.keys(tokensSnapshot.val());
            console.log('tokens:', tokens[0]);

            // Send notifications to all tokens.
            return admin.messaging().sendToDevice(tokens, payload).then(response => {
                        // For each message check if there was an error.
                        const tokensToRemove = [];
                response.results.forEach((result, index) => {
                    const error = result.error;
                    if (error) {
                        console.error('Failure sending notification to', tokens[index], error);
                        // Cleanup the tokens who are not registered anymore.
                        if (error.code === 'messaging/invalid-registration-token' ||
                            error.code === 'messaging/registration-token-not-registered') {
                            tokensToRemove.push(tokensSnapshot.ref.child(tokens[index]).remove());
                        }
                    }
                });
                return Promise.all(tokensToRemove);
            });
        });
    })
});

exports.pushNotificationComments = functions.database.ref('/post-comments/{postId}/{commentId}').onCreate(event => {

    const commentId = event.params.commentId;
    const postId = event.params.postId;
    const comment = event.data.val();

    console.log('New comment was added, id: ', postId);

    // Get the commented post .
    const getPostTask = admin.database().ref(`/posts/${postId}`).once('value');

    return getPostTask.then(post => {



        // Get the list of device notification tokens.
        const getDeviceTokensTask = admin.database().ref(`/profiles/${post.val().authorId}/notificationTokens`).once('value');
        console.log('getDeviceTokensTask path: ', `/profiles/${post.val().authorId}/notificationTokens`)

        // Get post author.
        const getCommentAuthorProfileTask = admin.database().ref(`/profiles/${comment.authorId}`).once('value');
        console.log('getCommentAuthorProfileTask path: ', `/profiles/${comment.authorId}`)

        Promise.all([getDeviceTokensTask, getCommentAuthorProfileTask]).then(results => {
            const tokensSnapshot = results[0];
            const commentAuthorProfile = results[1].val();

            if (commentAuthorProfile.id == post.val().authorId) {
                return console.log('User commented own post');
            }

            // Check if there are any device tokens.
            if (!tokensSnapshot.hasChildren()) {
                return console.log('There are no notification tokens to send to.');
            }

            console.log('There are', tokensSnapshot.numChildren(), 'tokens to send notifications to.');

            // Create a notification
            const payload = {
                data : {
                    actionType: actionTypeNewComment,
                    title: notificationTitle,
                    body: `${commentAuthorProfile.username} commented your post`,
                    icon: post.val().imagePath,
                    postId: postId,
                },
            };

            // Listing all tokens.
            const tokens = Object.keys(tokensSnapshot.val());
            console.log('tokens:', tokens[0]);

            // Send notifications to all tokens.
            return admin.messaging().sendToDevice(tokens, payload).then(response => {
                        // For each message check if there was an error.
                        const tokensToRemove = [];
                response.results.forEach((result, index) => {
                    const error = result.error;
                    if (error) {
                        console.error('Failure sending notification to', tokens[index], error);
                        // Cleanup the tokens who are not registered anymore.
                        if (error.code === 'messaging/invalid-registration-token' ||
                            error.code === 'messaging/registration-token-not-registered') {
                            tokensToRemove.push(tokensSnapshot.ref.child(tokens[index]).remove());
                        }
                    }
                });
                return Promise.all(tokensToRemove);
            });
        });
    })
});

exports.pushNotificationPostNew = functions.database.ref('/posts/{postId}').onCreate(event => {
    const postId = event.params.postId;
    console.log('New post was created');

    // Get post authorID.
    const getAuthorIdTask = admin.database().ref(`/posts/${postId}/authorId`).once('value');

     return getAuthorIdTask.then(authorId => {

        console.log('post author id', authorId.val());

          // Create a notification
        const payload = {
            data : {
                actionType: actionTypeNewPost,
                postId: postId,
                authorId: authorId.val(),
            },
        };

        // Send a message to devices subscribed to the provided topic.
        return admin.messaging().sendToTopic(postsTopic, payload)
                 .then(function(response) {
                   // See the MessagingTopicResponse reference documentation for the
                   // contents of response.
                   console.log("Successfully sent info about new post :", response);
                 })
                 .catch(function(error) {
                   console.log("Error sending info about new post:", error);
                 });
         });

});

// exports.emailFeedback = functions.database.ref('/feedbacks/{feedbackId}').onCreate(event => {
//   const val = event.data.val()

//   const mailOptions = {
//     from: '"RateMySinging App" <eriyazonline@gmail.com>',
//     to: gmailEmail,
//   };

//   // Building Email message.
//   mailOptions.subject = 'RateMySinging Feedback';
//   mailOptions.text = val.text;

//   return mailTransport.sendMail(mailOptions)
//     .then(() => console.log(`email sent`))
//     .catch((error) => console.error('There was an error while sending the email:', error));
// });

// Keeps track of the length of the 'likes' child list in a separate property.
exports.updatePostCounters = functions.database.ref('/post-ratings/{postId}/{authorId}/{ratingId}').onWrite(event => {
    const postRatingRef = event.data.ref.parent.parent;
    const postId = event.params.postId;
    console.log('Rating changed on post ', postId);
	
    return postRatingRef.once('value').then(snapshot => {
        let ratingTotal = 0;
        let ratingNum = snapshot.numChildren();
        snapshot.forEach(function(authorSnap) {
	      authorSnap.forEach(function(ratingSnap) {
		     ratingTotal = ratingTotal + ratingSnap.val().rating;
	      });
        });
        console.log("ratingTotal ", ratingTotal);
        // Get the rated post
        const postRef = admin.database().ref(`/posts/${postId}`);
        return postRef.transaction(current => {
            if (current == null) {
                console.log("ignore: null object returned from cache, expect another event with fresh server value.");
                return false;
            }
            current.ratingsCount = ratingNum;
            if (ratingNum > 0) {
                current.averageRating = ratingTotal/ratingNum;
            } else {
                current.averageRating = 0;
            }
            return current;
        }).then(() => {
            console.log('Post counters updated.');
        });
   });
});

exports.updatePostBoughtFeedbackStatus = functions.database.ref('/bought-feedbacks/{postId}').onWrite(event => {
    const postId = event.params.postId;
    const feedback = event.data.val();
    const isResolved = feedback.resolved;
    console.log('bought feedback status changed on post', postId, isResolved);

    const postRef = admin.database().ref(`/posts/${postId}`);
    return postRef.transaction(current => {
        if (current == null) {
            console.log("ignore: null object returned from cache, expect another event with fresh server value.");
            return false;
        }
        if (isResolved) {
            current.boughtFeedbackStatus = "GIVEN";
        } else {
            current.boughtFeedbackStatus = "ASKED";
        }
        return current;
    }).then(() => {
        console.log('Post bought feedback status updated.');
    });
});

// exports.commentsPoints = functions.database.ref('/post-comments/{postId}/{commentId}').onWrite(event => {

//     if (event.data.exists() && event.data.previous.exists()) {
//         return console.log("no points for comment updates");
//     }
//     const commentId = event.params.commentId;
//     const postId = event.params.postId;
//     const comment = event.data.exists() ? event.data.val() : event.data.previous.val();
//     const commentAuthorId = comment.authorId;
//     const comment_points = 2;

//     console.log('New comment was added, post id: ', postId);

//     // Get the commented post .
//     const getPostTask = admin.database().ref(`/posts/${postId}`).once('value');

//     return getPostTask.then(post => {

//         if (commentAuthorId == post.val().authorId) {
//             return console.log('User commented on own post');
//         }

//         // Get user points ref
//         const userPointsRef = admin.database().ref(`/user-points/${commentAuthorId}`);
//         var newPointRef = userPointsRef.push();
//         newPointRef.set({
//             'action': event.data.exists() ? "add":"remove",
//             'type': 'comment',
//             'value': event.data.exists() ? comment_points:-comment_points,
//             'creationDate': admin.database.ServerValue.TIMESTAMP
//         });

//         // Get rating author.
//         const authorProfilePointsRef = admin.database().ref(`/profiles/${commentAuthorId}/points`);
//         return authorProfilePointsRef.transaction(current => {
//             if (event.data.exists()) {
//               return (current || 0) + comment_points;
//             } else {
//               return (current || 0) - comment_points;
//             }
//         }).then(() => {
//             console.log('User comment points updated.');
//         });

//     })
// });

// Two different fuctions for post add and remove, because there were too many post update request
// and firebase has restriction on frequency of function calls.
exports.postAddedPoints = functions.database.ref('/posts/{postId}').onCreate(event => {
    const postId = event.params.postId;
    const post = event.data.val();
    const postAuthorId = post.authorId;
    var post_points = 3;
    console.log('Post created. ', postId);
    if (post.longRecording) post_points = 10;
    // Get user points ref
    const userPointsRef = admin.database().ref(`/user-points/${postAuthorId}`);
    var newPointRef = userPointsRef.push();
    newPointRef.set({
        'action': "add",
        'type': 'post',
        'value': -post_points,
        'creationDate': admin.database.ServerValue.TIMESTAMP
    });

    // Get rating author.
    const authorProfilePointsRef = admin.database().ref(`/profiles/${postAuthorId}/points`);
    return authorProfilePointsRef.transaction(current => {
          current = (current || 0) - post_points;
          if (current > 0) {
                return current;
          } else {
                return 0;
          }
    }).then(() => {
        console.log('User post added points updated.');
    });
});

function addPoints(profileId, points) {
    const authorProfilePointsRef = admin.database().ref(`/profiles/${profileId}/points`);
    return authorProfilePointsRef.transaction(current => {
          return (current || 0) + points;
    }).then(() => {
        console.log(points, 'points added to user ', profileId);
    });
}

// exports.postDeletePoints = functions.database.ref('/posts/{postId}').onDelete(event => {
//     const postId = event.params.postId;
//     const post = event.data.previous.val();
//     const postAuthorId = post.authorId;
//     console.log('Post removed. ', postId);
//     // Get user points ref
//     const userPointsRef = admin.database().ref(`/user-points/${postAuthorId}`);
//     var newPointRef = userPointsRef.push();
//     newPointRef.set({
//         'action': "remove",
//         'type': 'post',
//         'value': 5,
//         'creationDate': admin.database.ServerValue.TIMESTAMP
//     });

//     // Get rating author.
//     const authorProfilePointsRef = admin.database().ref(`/profiles/${postAuthorId}/points`);
//     return authorProfilePointsRef.transaction(current => {
//           return (current || 0) + 5;
//     }).then(() => {
//         console.log('User post points updated.');
//     });
// });

exports.ratingPoints = functions.database.ref('/post-ratings/{postId}/{authorId}/{ratingId}').onWrite(event => {
    if (event.data.exists() && event.data.previous.exists()) {
        return console.log("no points for rating updates");
    }
    console.log('Points for new/remove rating');

    const ratingAuthorId = event.params.authorId;
    const postId = event.params.postId;

    // Get rated post.
    const getPostTask = admin.database().ref(`/posts/${postId}`).once('value');

    return getPostTask.then(post => {

        if (ratingAuthorId == post.val().authorId) {
            return console.log('User rated own post');
        }

        // Get user points ref
        const userPointsRef = admin.database().ref(`/user-points/${ratingAuthorId}`);
        var newPointRef = userPointsRef.push();
        newPointRef.set({
            'action': event.data.exists() ? "add":"remove",
            'type': 'rating',
            'value': event.data.exists() ? 1:-1,
            'creationDate': admin.database.ServerValue.TIMESTAMP
        });

        // Get rating author.
        const authorProfilePointsRef = admin.database().ref(`/profiles/${ratingAuthorId}/points`);
        return authorProfilePointsRef.transaction(current => {
            if (event.data.exists()) {
              return (current || 0) + 1;
            } else {
              return (current || 0) - 1;
            }
        }).then(() => {
            console.log('User rating points updated.');
        });

    })
});

exports.appNotificationRatings = functions.database.ref('/post-ratings/{postId}/{authorId}/{ratingId}').onCreate(event => {
    console.log('App notification for new rating');

    const ratingAuthorId = event.params.authorId;
    const postId = event.params.postId;

    // Get rated post.
    const getPostTask = admin.database().ref(`/posts/${postId}`).once('value');

    return getPostTask.then(post => {
        var postAuthorId = post.val().authorId;
        if (ratingAuthorId == postAuthorId) {
            return console.log('User rated own post');
        }
        // Get rating author.
        const getRatingAuthorProfileTask = admin.database().ref(`/profiles/${ratingAuthorId}`).once('value');

        return getRatingAuthorProfileTask.then(profile => {
            // Get user notification ref
            const userNotificationsRef = admin.database().ref(`/user-notifications/${postAuthorId}`);
            var newNotificationRef = userNotificationsRef.push();
            var msg = profile.val().username + " rated your post '" + post.val().title + "'";
            newNotificationRef.set({
                'action': 'com.eriyaz.social.activities.PostDetailsActivity',
                'fromUserId' : ratingAuthorId,
                'message': msg,
                'extraKey' : 'PostDetailsActivity.POST_ID_EXTRA_KEY',
                'extraKeyValue' : postId,
                'createdDate': admin.database.ServerValue.TIMESTAMP
            });
        });

    })
});

exports.duplicateUserRating = functions.database.ref('/post-ratings/{postId}/{authorId}/{ratingId}').onWrite(event => {
    console.log('Duplicate user rating');
    const ratingAuthorId = event.params.authorId;
    const ratingId = event.params.ratingId;
    const postId = event.params.postId;
    const rating = event.data.val();
    if (rating != null) rating.postId = postId;
    const userRatingRef = admin.database().ref(`/user-ratings/${ratingAuthorId}/${ratingId}`);
    return userRatingRef.set(rating);
});

exports.appNotificationComments = functions.database.ref('/post-comments/{postId}/{commentId}').onCreate(event => {
    console.log('App notification for new comment');

    const commentId = event.params.commentId;
    const postId = event.params.postId;
    const comment = event.data.val();
    const commentAuthorId = comment.authorId;

    // Get rated post.
    const getPostTask = admin.database().ref(`/posts/${postId}`).once('value');

    return getPostTask.then(post => {
        var postAuthorId = post.val().authorId;
        if (commentAuthorId == postAuthorId) {
            return console.log('User commented on own post');
        }
        // Get comment author.
        const getCommentAuthorProfileTask = admin.database().ref(`/profiles/${commentAuthorId}`).once('value');

        return getCommentAuthorProfileTask.then(profile => {
            // Get user notification ref
            const userNotificationsRef = admin.database().ref(`/user-notifications/${postAuthorId}`);
            var newNotificationRef = userNotificationsRef.push();
            var msg = profile.val().username + " commented on your post '" + post.val().title + "'";
            newNotificationRef.set({
                'action': 'com.eriyaz.social.activities.PostDetailsActivity',
                'fromUserId' : commentAuthorId,
                'message': msg,
                'extraKey' : 'PostDetailsActivity.POST_ID_EXTRA_KEY',
                'extraKeyValue' : postId,
                'createdDate': admin.database.ServerValue.TIMESTAMP
            });
        });
    })
});

exports.appNotificationCommentConversation = functions.database.ref('/post-comments/{postId}/{commentId}').onCreate(event => {
    console.log('App notification for new comment in conversation');

    const postCommentRef = event.data.ref.parent;
    const commentId = event.params.commentId;
    const postId = event.params.postId;
    const comment = event.data.val();
    const commentAuthorId = comment.authorId;

    // Get commented post.
    const getPostTask = admin.database().ref(`/posts/${postId}`).once('value');

    return getPostTask.then(post => {
        const postVal = post.val();
        console.log("new comment on post '", postVal.title,"'.");
        var postAuthorId = postVal.authorId;
        // process all post comments
        return postCommentRef.once('value').then(snapshot => {
            const authorToNotify = [];
            snapshot.forEach(function(commentSnap) {
                // exclude post author & comment user
                const notifyAuthorId = commentSnap.val().authorId;
                if (notifyAuthorId  != postAuthorId && notifyAuthorId != commentAuthorId ) {
                    if (!authorToNotify.includes(notifyAuthorId)) {
                        authorToNotify.push(notifyAuthorId);
                    }
                }
            });
            if (authorToNotify.length == 0) return;
            // Get comment author.
            const getCommentAuthorProfileTask = admin.database().ref(`/profiles/${commentAuthorId}`).once('value');
            return getCommentAuthorProfileTask.then(profile => {
                const promisePool = new PromisePool(() => {
                  if (authorToNotify.length > 0) {
                    const authorId = authorToNotify.pop();
                    // Get user notification ref
                    const userNotificationsRef = admin.database().ref(`/user-notifications/${authorId}`);
                    var newNotificationRef = userNotificationsRef.push();
                    var msg = profile.val().username + " commented on the post '" + postVal.title + "' on which you also commented.";
                    return newNotificationRef.set({
                        'action': 'com.eriyaz.social.activities.PostDetailsActivity',
                        'fromUserId' : commentAuthorId,
                        'message': msg,
                        'extraKey' : 'PostDetailsActivity.POST_ID_EXTRA_KEY',
                        'extraKeyValue' : postId,
                        'createdDate': admin.database.ServerValue.TIMESTAMP
                    }).then(() => {
                        console.log('sent new comment notification on post you commented to ', authorId);
                    });
                  }
                  return null;
                }, MAX_CONCURRENT);
                const poolTask =  promisePool.start();
                return poolTask.then(() => {
                    return console.log('sent notification task completed.');
                });
            });
        });
    });
});

exports.appNotificationMessages = functions.database.ref('/user-messages/{userId}/{messageId}').onCreate(event => {
    console.log('App notification for new message');

    const messageId = event.params.messageId;
    const userId = event.params.userId;
    const message = event.data.val();
    const messageAuthorId = message.senderId;
    const messageListRef = event.data.ref.parent;
    const parentMessageId = message.parentId;

    if (parentMessageId == null) {
        if (messageAuthorId == userId) {
            return console.log("messaged on own profile, no notification");
        }
         // Get message author.
        const getMessageAuthorProfileTask = admin.database().ref(`/profiles/${messageAuthorId}`).once('value');

        return getMessageAuthorProfileTask.then(profile => {
            var msg = profile.val().username + " left a message on your profile page.";
            return sendAppMessageNotification(userId, messageAuthorId, msg, userId);
        });
    }
    // Get parent feedback.
    const getParentMessageTask = admin.database().ref(`/user-messages/${userId}/${parentMessageId}`).once('value');

    return getParentMessageTask.then(parentMessage => {
        const parentMessageVal = parentMessage.val();
        console.log("new reply on message ", parentMessageVal.id);
        var parentMessageAuthorId = parentMessageVal.senderId;
        var sentParentAuthorNotification = false;
        if (parentMessageAuthorId != messageAuthorId) sentParentAuthorNotification = true;

        // Get all message with same parent message
        const getChildrenMessageTask = messageListRef.orderByChild('parentId').equalTo(parentMessageId).once('value');
        return getChildrenMessageTask.then(snapshot => {
            const authorToNotify = [];
            snapshot.forEach(function(messageSnap) {
                // exclude parent author & message author
                const notifyAuthorId = messageSnap.val().senderId;
                if (notifyAuthorId  != parentMessageAuthorId && notifyAuthorId != messageAuthorId ) {
                    if (!authorToNotify.includes(notifyAuthorId)) {
                        authorToNotify.push(notifyAuthorId);
                    }
                }
            });
            if (authorToNotify.length == 0 && sentParentAuthorNotification == false) return;
            // Get message author.
            const getMessageAuthorProfileTask = admin.database().ref(`/profiles/${messageAuthorId}`).once('value');
            return getMessageAuthorProfileTask.then(profile => {
                const promisePool = new PromisePool(() => {
                    if (sentParentAuthorNotification) {
                        sentParentAuthorNotification = false;
                        var msg = profile.val().username + " replied on your message.";
                        return sendAppMessageNotification(parentMessageAuthorId, messageAuthorId, msg, userId);
                    }
                  if (authorToNotify.length > 0) {
                    const authorId = authorToNotify.pop();
                    var msg = profile.val().username + " replied on the message on which you also replied.";
                    return sendAppMessageNotification(authorId, messageAuthorId, msg, userId);
                  }
                  return null;
                }, MAX_CONCURRENT);
                const poolTask =  promisePool.start();
                return poolTask.then(() => {
                    return console.log('sent message notification task completed.');
                });
            });
        });
    });
});

function sendAppMessageNotification(authorId, fromUserId, msg, extraKeyValue) {
    console.log("sending msg:", msg);
    // Get user notification ref
    const userNotificationsRef = admin.database().ref(`/user-notifications/${authorId}`);
    var newNotificationRef = userNotificationsRef.push();
    return newNotificationRef.set({
        'action': 'com.eriyaz.social.activities.MessageActivity',
        'fromUserId' : fromUserId,
        'message': msg,
        'extraKey' : 'ProfileActivity.USER_ID_EXTRA_KEY',
        'extraKeyValue' : extraKeyValue,
        'createdDate': admin.database.ServerValue.TIMESTAMP
    });
}

function sendAppRewardsNotification(authorId, fromUserId, msg) {
    console.log("sending msg:", msg);
    // Get user notification ref
    const userNotificationsRef = admin.database().ref(`/user-notifications/${authorId}`);
    var newNotificationRef = userNotificationsRef.push();
    return newNotificationRef.set({
        'action': 'com.eriyaz.social.activities.ProfileActivity',
        'fromUserId' : fromUserId,
        'message': msg,
        'extraKey' : 'ProfileActivity.USER_ID_EXTRA_KEY',
        'extraKeyValue' : authorId,
        'createdDate': admin.database.ServerValue.TIMESTAMP
    });
}

function sendAppFeedbackNotification(authorId, fromUserId, msg) {
    // Get user notification ref
    const userNotificationsRef = admin.database().ref(`/user-notifications/${authorId}`);
    var newNotificationRef = userNotificationsRef.push();
    return newNotificationRef.set({
            'action': 'com.eriyaz.social.activities.FeedbackActivity',
            'fromUserId' : fromUserId,
            'message': msg,
            'createdDate': admin.database.ServerValue.TIMESTAMP
        }).then(() => {
            console.log('sent new feedback reply notification on feedback you replied to ', authorId);
        });
}

exports.appNotificationFeedbackConversation = functions.database.ref('/feedbacks/{feedbackId}').onCreate(event => {
    console.log('App notification for new feedback in conversation');

    const feedbackListRef = event.data.ref.parent;
    const feedbackId = event.params.feedbackId;
    const feedback = event.data.val();
    const feedbackAuthorId = feedback.senderId;
    const parentFeedbackId = feedback.parentId;

    if (parentFeedbackId == null) {
        return console.log("stand alone feedback: don't send any notification, ", feedbackId);
    }

    // Get parent feedback.
    const getParentFeedbackTask = admin.database().ref(`/feedbacks/${parentFeedbackId}`).once('value');

    return getParentFeedbackTask.then(parentFeedback => {
        const parentFeedbackVal = parentFeedback.val();
        console.log("new reply on feedback ", parentFeedbackVal.id);
        var parentFeedbackAuthorId = parentFeedbackVal.senderId;
        var sentParentAuthorNotification = false;
        if (parentFeedbackAuthorId != feedbackAuthorId) sentParentAuthorNotification = true;

        // Get all feedback with same parent feedback
        const getChildrenFeedbackTask = feedbackListRef.orderByChild('parentId').equalTo(parentFeedbackId).once('value');
        return getChildrenFeedbackTask.then(snapshot => {
            const authorToNotify = [];
            snapshot.forEach(function(feedbackSnap) {
                // exclude parent author & feedback author
                const notifyAuthorId = feedbackSnap.val().senderId;
                if (notifyAuthorId  != parentFeedbackAuthorId && notifyAuthorId != feedbackAuthorId ) {
                    if (!authorToNotify.includes(notifyAuthorId)) {
                        authorToNotify.push(notifyAuthorId);
                    }
                }
            });
            if (authorToNotify.length == 0 && sentParentAuthorNotification == false) return;
            // Get feedback author.
            const getFeedbackAuthorProfileTask = admin.database().ref(`/profiles/${feedbackAuthorId}`).once('value');
            return getFeedbackAuthorProfileTask.then(profile => {
                const promisePool = new PromisePool(() => {
                    if (sentParentAuthorNotification) {
                        sentParentAuthorNotification = false;
                        var msg = profile.val().username + " replied on your feedback.";
                        return sendAppFeedbackNotification(parentFeedbackAuthorId, feedbackAuthorId, msg);
                    }
                  if (authorToNotify.length > 0) {
                    const authorId = authorToNotify.pop();
                    var msg = profile.val().username + " replied on the feedback on which you also replied.";
                    return sendAppFeedbackNotification(authorId, feedbackAuthorId, msg);
                  }
                  return null;
                }, MAX_CONCURRENT);
                const poolTask =  promisePool.start();
                return poolTask.then(() => {
                    return console.log('sent feedback notification task completed.');
                });
            });
        });
    });
});

exports.incrementUserUnseenNotification = functions.database.ref('/user-notifications/{authorId}/{notificationId}').onCreate(event => {
    const authorId = event.params.authorId;
    const authorProfileUnseenRef = admin.database().ref(`/profiles/${authorId}/unseen`);
    return authorProfileUnseenRef.transaction(current => {
          return (current || 0) + 1;
    }).then(() => {
        console.log('User unseen count incremented.');
    });
});

exports.taskPopulatePastRatedData = functions.https.onRequest((req, res) => {
    // check if security key is same
    const keyParam = req.query.key;
    const key = "Test!234";
    if (key != keyParam) {
        console.log('The key ', key,' provided in the request does not match the key set in the environment.');
        res.status(403).send('Security key does not match. Make sure your "key" URL query parameter matches the ' +
          'cron.key environment variable.');
        return null;
    }
    return nextPostRating(res);
});

function nextPostRating(res, key) {
    if (key == null) {
        return admin.database().ref(`/post-ratings/`).orderByKey().limitToFirst(4).once('value').then(snapshot => {
            var lastPostId;
            snapshot.forEach(function(child) {
                lastPostId = child.key;
                console.log(lastPostId);
            });
            return nextPostRating(res, lastPostId);
        });
    } else {
        return admin.database().ref(`/post-ratings/`).orderByKey().startAt(key).limitToFirst(4).once('value').then(snapshot => {
            var lastPostId;
            snapshot.forEach(function(child) {
                lastPostId = child.key;
                if (key == lastPostId) return;
                processAuthorRatingNode(child);
                console.log(lastPostId);
            });
            if (snapshot.numChildren() == 4) {
                return nextPostRating(res, lastPostId);
            } else {
                console.log("exit function");
                return res.status(200).send('User notification task finished');
            }
        });
    }
}

function processAuthorRatingNode(postSnap) {
    postSnap.forEach(function(authorSnap) {
        var postId = postSnap.key;
        console.log('Rating updated for post ', postId);
        const ratingAuthorId = authorSnap.key;
        authorSnap.forEach(function(ratingSnap) {
            const ratingId = ratingSnap.key;
            var ratingRef = admin.database().ref(`/post-ratings/${postId}/${ratingAuthorId}/${ratingId}`);
            return ratingRef.transaction(current => {
                if (current == null) {
                    console.log('Rating object null for post ', postId);
                    return false;
                }
                current.viewedByPostAuthor = true;
                return current;
            });
        });
    });
}

// exports.generateChecksum = functions.https.onRequest((req, res) => {
//     var paramarray = {};
//     paramarray['MID'] = "SeeonE99000076026859"; //Provided by Paytm
//     paramarray['ORDER_ID'] = "ORDER3"; //unique OrderId for every request
//     paramarray['CUST_ID'] = "CUST3";  // unique customer identifier 
//     paramarray['INDUSTRY_TYPE_ID'] = "Retail"; //Provided by Paytm
//     paramarray['CHANNEL_ID'] = "WAP"; //Provided by Paytm
//     paramarray['TXN_AMOUNT'] = "5.0"; // transaction amount
//     paramarray['WEBSITE'] = "APPSTAGING"; //Provided by Paytm
//     paramarray['CALLBACK_URL'] = 'https://securegw.paytm.in/theia/paytmCallback?ORDER_ID=ORDER3';//Provided by Paytm
//     paytm_checksum.genchecksum(paramarray, paytm_config.MERCHANT_KEY, function (err, output) {
//         console.log(output);
//         if(paytm_checksum.verifychecksum(output, paytm_config.MERCHANT_KEY)) {
//             console.log("true");
//         }else{
//             console.log("false");
//         }
//         return res.status(200).send(JSON.stringify(output));
//     });
// });

exports.grantSignupReward = functions.database.ref('/profiles/{uid}/id').onCreate(event => {
    console.log("new user signed in");
      var uid = event.params.uid;
      admin.database().ref(`profiles/${uid}`)
        .once('value').then(function(profileSnap) {
          var profile = profileSnap.val();
          console.log("referred_by", profile.referred_by);
          if (profile.referred_by) {
            // add reward points
            const addPointsTask =  addPoints(profile.referred_by, REWARD_POINTS);
            const msg = "Congrats your friend " +  profile.username + " joined. " +  REWARD_POINTS +" points added to your profile.";
            const notificationTask = sendAppRewardsNotification(profile.referred_by, uid, msg);
            return Promise.all([addPointsTask, notificationTask]).then(results => {
                console.log("all reward tasks completed.");
            });
          }
        });
    });

exports.appUpdateNotification = functions.https.onRequest((req, res) => {
    // check if security key is same
    const keyParam = req.query.key;
    const key = "Test!234";
    if (key != keyParam) {
        console.log('The key ', key,' provided in the request does not match the key set in the environment.');
        res.status(403).send('Security key does not match. Make sure your "key" URL query parameter matches the ' +
          'cron.key environment variable.');
        return null;
    }
    // Get profiles
    const getProfilesTask = admin.database().ref(`/profiles/`).once('value');
    return getProfilesTask.then(snapshot => {
        const snapshotVal = snapshot.val();
        const profiles = Object.keys(snapshotVal).map(key => snapshotVal[key]);
        // const profiles = Object.values(profilesSnapshot.val());
        // const profiles = profilesSnapshot.val();
        console.log("About to update ", profiles.length, ' users.');
        const msg = "New version of the app is available now with important updates. Tap to update.";
        const promisePool = new PromisePool(() => {
          if (profiles.length > 0) {
            const profile = profiles.pop();
            // Get user notification ref
            const authorId = profile.id;
            const userNotificationsRef = admin.database().ref(`/user-notifications/${authorId}`);
            var newNotificationRef = userNotificationsRef.push();
            // add notification
            return newNotificationRef.set({
                'action': 'com.eriyaz.social',
                //'fromUserId' : '',
                'message': msg,
                'openPlayStore': true,
                'createdDate': admin.database.ServerValue.TIMESTAMP
            });
          }
          return null;
        }, MAX_CONCURRENT);
        const poolTask =  promisePool.start();
        return poolTask.then(() => {
            return console.log('added notification to user');
        }).catch((error) => {
            console.error('User notification failed:', error);
        }).then(() => {
            console.log('User notification task finished');
            return res.status(200).send('User notification task finished');
        });
    });
});

// exports.appUninstall = functions.analytics.event('app_remove').onLog(event => {
//     const user = event.data.user;
//     const uid = user.userId;
//     console.log("app uninstall detected for uid ",uid);
//     // Get profile of user and set user details
//     if (uid) {
//         const profileUninstallRef = admin.database().ref(`/uninstall/track/${uid}`);
//         const newProfileUninstallRef = profileUninstallRef.push();
//         user.uninstallTime = event.data.logTime;
//         return newProfileUninstallRef.set(user).then(() => {
//             console.log('uninstall user profile updated with event details.');
//         });
//     } else {
//         const appInstanceId = user.appInfo.appInstanceId;
//         const uninstallUntrackRef = admin.database().ref(`/uninstall/untrack/${appInstanceId}`);
//         const newUninstallUntrackRef = uninstallUntrackRef.push();
//         user.uninstallTime = event.data.logTime;
//         return newUninstallUntrackRef.set(user).then(() => {
//             console.log('updated uninstall details of untracked user.');
//         });
//     }
// });

// exports.incrementUserMessageCount = functions.database.ref('/user-messages/{authorId}/{messageId}').onCreate(event => {
//     const authorId = event.params.authorId;
//     const authorProfileMessageCountRef = admin.database().ref(`/profiles/${authorId}/messageCount`);
//     return authorProfileMessageCountRef.transaction(current => {
//           return (current || 0) + 1;
//     }).then(() => {
//         console.log('User message count incremented.');
//     });
// });

// exports.decrementUserMessageCount = functions.database.ref('/user-messages/{authorId}/{messageId}').onDelete(event => {
//     const authorId = event.params.authorId;
//     const authorProfileMessageCountRef = admin.database().ref(`/profiles/${authorId}/messageCount`);
//     return authorProfileMessageCountRef.transaction(current => {
//           return (current || 1) - 1;
//     }).then(() => {
//         console.log('User message count decremented.');
//     });
// });



// const bigquery = require('@google-cloud/bigquery')();

// exports.syncBigQueryPost = functions.database.ref('/posts/{postId}').onCreate((snapshot,context) => {
  
// 	const dataset = bigquery.dataset("com_eriyaz_social_ANDROID");
// 	const table = dataset.table("post");
  
// 	const postTitle = snapshot.val().title;
// 	return table.insert({
// 		id: context.params.postId,
// 		title : postTitle,
// 	  });
// });