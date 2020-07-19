const https = require("https");
const list_is_empty = "#list_is_empty#";

var querystring = require("querystring");

/**
 * List API end-point.
 */
const api_url = "api.amazonalexa.com";
const api_port = "443";

var Alexa = require("alexa-sdk");

// this is the array of tasks that are used for responses
const tasks = require("tasks.json");

exports.handler = function(event, context, callback) {
  var alexa = Alexa.handler(event, context);
  alexa.appId = "amzn1.ask.skill.e9792097-1e57-4e56-b6e2-df5bec537617";
  //alexa.dynamoDBTableName = 'preembarkplan';
  alexa.registerHandlers(handlers);
  alexa.execute();
};

/**
 * Called when the session starts.
 */
const newSessionRequestHandler = function() {
  console.log("Starting newSessionRequestHandler");
  // verify that permissions exist with the start of any new session - error out if not included
  if (!this.event.session.user.permissions) {
    var speechOutput =
      "Alexa List permissions are missing. You can grant permissions within the Alexa app.";
    var permissions = ["write::alexa:household:list"];
    this.emit(":tellWithPermissionCard", speechOutput, permissions);
    console.log("Ending newSessionRequestHandler");
  } else {
    this.emit(LAUNCH_REQUEST);
  }
};

/**
 * Handler for the launch request event when no particular intent is invoked.
 */
const launchRequestHandler = function() {
  console.log("Starting launchRequestHandler");
  const speechWelcomeOutput =
    "Welcome to pre embark plan. To begin, please say something like tell me my tasks.";
  const repeatWelcomeOutput =
    "Thank you for using the pre embark plan skill. To get started with creating your " +
    "first task list, just say tell me my tasks, and I will walk you through a series of questions.";
  this.emit(":ask", speechWelcomeOutput, repeatWelcomeOutput);
};

/**
 * This is the handler for the SessionEnded event.
 */
const sessionEndedRequestHandler = function() {
  console.log("Starting sessionEndedRequestHandler");
  var speechOutput = "Goodbye";
  this.response.speak(speechOutput);
  this.emit(":responseReady");
  console.log("Ending sessionEndedRequestHandler");
};

/**
 * This is the handler for the Unhandled event.
 */
const unhandledRequestHandler = function() {
  console.log("Starting unhandledRequestHandler");
  var speechOutput = "This request is not supported.";
  this.response.speak(speechOutput).listen(speechOutput);
  this.emit(":responseReady");
  console.log("Ending unhandledRequestHandler");
};

/**
 * This is the handler for the Amazon help built in intent.
 */
const amazonHelpHandler = function() {
  console.log("Starting amazonHelpHandler");
  const speechHelpOutput =
    `This is the pre embark plan skill. The purpose of this skill is to assist in planning the weeks before you begin at Amazon. We create a list of tasks to complete before your Day One to help you be better prepared. Just say, tell me my tasks to begin.`;
  const repeatHelpOutput =
    "Get started by saying, tell me my tasks.";
  this.emit(":ask", speechHelpOutput, repeatHelpOutput);
};

/**
 * This is the handler for the Amazon cancel built-in intent.
 */
const amazonCancelHandler = function() {
  console.log("Starting amazonCancelHandler");
  var speechOutput = "Goodbye";
  this.response.speak(speechOutput);
  this.emit(":responseReady");
  console.log("Ending amazonCancelHandler");
};

/**
 * This is the handler for the Amazon stop built in intent.
 */
const amazonStopHandler = function() {
  console.log("Starting amazonStopHandler");
  var speechOutput = "Goodbye";
  this.response.speak(speechOutput);
  this.emit(":responseReady");
  console.log("Ending amazonStopHandler");
};

/**
 * This is the handler for listing out all tasks from the custom slot
 */
const listTasksHandler = function() {
  console.log("List Tasks Handler");
  var speechOutput =
    "Some of the tasks are things to learn, but others are things to complete using information provided by your recruiter. You just need to access the preset lists.";
  var repeatOutput =
    "Are you ready to start? Say tell me my tasks";
  this.emit(":ask", speechOutput, repeatOutput);
};

/**
 * This is the handler for listing out all tasks for a given week
 */

const listTasksForWeek = function() {
  // first check if the dialog is in a state where
  if (this.event.request.dialogState === "COMPLETED") {
    console.log("List Tasks for Weeks Handler");
    // this is the part of the message that the NLU has evaluated the slot data
    const week = this.event.request.intent.slots.week.resolutions
      .resolutionsPerAuthority[0];
    var speechOutput = "Here are there tasks I have for your ";
    // check if the week slot found a match, if so lookup tasks for it
    console.log(JSON.stringify(week));
    if (week.status.code === "ER_SUCCESS_MATCH") {
      speechOutput =
        speechOutput + this.event.request.intent.slots.week.value + ". ";
      var sampleTasks = "Complete your I9 form.";
      for (var i = 0; i < tasks.length; i++) {
        if (week.values[0].value.name.toLowerCase() === tasks[i].week) {
          speechOutput = speechOutput + tasks[i].tasks + ", ";
          sampleTasks = tasks[i].tasks;
        }
      }
      speechOutput =
        speechOutput +
        "If you want a full description of any of these tasks, just say " +
        "something like, explain " +
        sampleTasks +
        ".";
    } else {
      speechOutput =
        "Sorry, I don't have tasks for your " +
        this.event.request.intent.slots.week.value +
        ". " +
        "Please say something like, list tasks for week one.";
        //CAROLINE THIS LANGUAGE MIGHT NEED CHANGING ABOVE
    }
    var repeatOutput =
      "Do you want information on what tasks I know about? Just say, list all tasks.";
    this.emit(":ask", speechOutput, repeatOutput);
  } else {
    // this gets invoked when the dialog state is in-progress. delegate back to Alexa to complete data capture
    console.log("not enough data provided");
    this.context.succeed({
      response: {
        directives: [
          {
            type: "Dialog.Delegate"
          }
        ],
        shouldEndSession: false
      },
      sessionAttributes: {}
    });
  }
};

/**
 * This is the handler for describing a specific task
 */

const explaintasks = function() {
  console.log("Explain an task");
  // check if the required information has been provided in the dialog - if so, then proceed.
  if (this.event.request.dialogState === "COMPLETED") {
    // this is the part of the message that the NLU has evaluated the slot data
    const tasks = this.event.request.intent.slots.task.resolutions
      .resolutionsPerAuthority[0];
    var speechOutput =
      "More details on " +
      this.event.request.intent.slots.tasks.value +
      ". ";
    var repeatOutput =
      "If you would like more details on what tasks are available, just say list tasks.";
    if (tasks.status.code === "ER_SUCCESS_MATCH") {
      console.log(JSON.stringify(tasks));
      // find the details on the task
      for (var i = 0; i < tasks.length; i++) {
        if (
          tasks.values[0].value.name.toLowerCase() ===
          tasks[i].tasks.toLowerCase()
        ) {
          speechOutput = tasks[i].description;
        }
      }
      speechOutput =
        speechOutput +
        " To add this to your task plan, just say something like " +
        "add " +
        this.event.request.intent.slots.tasks.value +
        ".";
      repeatOutput =
        "Would you like to add this task to your plan? If so, just say something like " +
        "add  " +
        this.event.request.intent.slots.tasks.value +
        ".";
    } else {
      speechOutput =
        "Sorry, I don't have information on " +
        this.event.request.intent.slots.tasks.value +
        ". " +
        "For a list of what tasks I can help you with, please say list all tasks.";
    }
    this.emit(":ask", speechOutput, repeatOutput);
  } else {
    console.log("not enough data provided");
    this.context.succeed({
      response: {
        directives: [
          {
            type: "Dialog.Delegate"
          }
        ],
        shouldEndSession: false
      },
      sessionAttributes: {}
    });
  }
};

/**
 * This is the handler for the top to-do intent.
 */
const topToDoHandler = function() {
  var speechOutput = "";
  var that = this;
  console.log("Starting top todo handler");
  console.log("this.event = " + JSON.stringify(this.event));
  getTopToDoItem(this.event.session, function(itemName) {
    if (!itemName) {
      speechOutput =
        "Alexa List permissions are missing. You can grant permissions within the Alexa app.";
      var permissions = ["read::alexa:household:list"];
      that.emit(":tellWithPermissionCard", speechOutput, permissions);
    } else if (itemName === list_is_empty) {
      speechOutput = "Your todo list is empty.";
      that.response.speak(speechOutput);
      that.emit(":responseReady");
    } else {
      speechOutput = "Your top todo is " + itemName;
      that.response.speak(speechOutput);
      that.emit(":responseReady");
    }
  });
  console.log("Ending top todo handler");
};

/**
 * This is the handler for the delete top to-do intent.
 */
const clearTopToDoHandler = function() {
  var speechOutput = "";
  var that = this;
  console.info("Starting clear top todo handler");
  clearTopToDoAction(this.event.session, function(status) {
    if (!status) {
      speechOutput =
        "Alexa List permissions are missing. You can grant permissions within the Alexa app.";
      var permissions = ["write::alexa:household:list"];
      that.emit(":tellWithPermissionCard", speechOutput, permissions);
    } else if (status === list_is_empty) {
      speechOutput =
        "I could not delete your top todo. Your todo list is empty.";
      that.response.speak(speechOutput);
      that.emit(":responseReady");
    } else if (status === 200) {
      speechOutput = "I successfully deleted your top todo.";
      this.response.speak(speechOutput);
      that.emit(":responseReady");
    } else {
      speechOutput =
        "I could not delete the todo. The developers are debugging response code " +
        status;
      this.response.speak(speechOutput);
      that.emit(":responseReady");
    }
  });
  console.info("Ending clear top todo handler");
};

/**
 * This is the handler for creating a new list to the Alexa app
 */

const addListHandler = function() {
  console.log("add list intent");
  var speechOutput = "";
  var repeatOutput = "";
  var that = this;

  addNewListAction(this.event.session, function(status, listId) {
    console.log("receieved status: " + status);
    console.log("receieved list id: " + listId);
    if (status === 201) {
      speechOutput =
        "New task list created. Now let's get started with adding the first task. " +
        "Add all week one tasks";
      repeatOutput =
        "The next step is to add any additional tasks. Say something like, " +
        "find housing.";
      that.attributes["listId"] = listId;
      that.emit(":ask", speechOutput, repeatOutput);
    } else if (status === 409) {
      speechOutput =
        "You have already started creating a task list. Just check the list in the companion " +
        "app for what tasks are planned. " +
        "If you would like to add more " +
        "tasks to your plan, please say something like add pack for work.";
      repeatOutput =
        "If you want to add more tasks to the weeks before you begin at Amazon, please say something like " +
        "add complete entry survey.";
      that.emit(":ask", speechOutput, repeatOutput);
    }
  });
};

// --------------- Helper List API functions -----------------------

const addNewListAction = function(session, callback) {
  console.log("prepare New List API call");

  var path = "/v2/householdlists/";

  console.log("path:" + path);

  var postData = {
    name: "task list Tracker", //item value, with a string description up to 256 characters
    state: "active" // item status (Enum: "active" only)
  };

  var consent_token = session.user.permissions.consentToken;

  var options = {
    host: api_url,
    port: api_port,
    path: path,
    method: "POST",
    headers: {
      Authorization: "Bearer " + consent_token,
      "Content-Type": "application/json"
    }
  };

  var req = https.request(options, res => {
    console.log("statusCode:", res.statusCode);
    console.log("headers:", res.headers);
    var data = "";

    res.on("data", d => {
      console.log("data received:" + d);
      data += d;
    });
    res.on("error", e => {
      console.log("error received");
      console.error(e);
    });
    res.on("end", function() {
      console.log("ending post request");
      if (res.statusCode === 201) {
        var responseMsg = eval("(" + data + ")");
        console.log("new list id:" + responseMsg.listId);
        callback(res.statusCode, responseMsg.listId);
      } else {
        callback(res.statusCode, 0);
      }
    });
  });

  req.end(JSON.stringify(postData));
};

/**
 * This checks the to-do item list, validates permissions, then adds to the list
 */
const addtaskAction = function(event, callback) {
  console.log("prepare API call and check permissions");

  getToDoList(event.session, function(returnValue) {
    if (!returnValue) {
      callback(null);
      return;
    }
    if (!event.session.user.permissions) {
      console.log("permissions are not defined");
      callback(null);
      return;
    }

    console.log("current list data:" + JSON.stringify(returnValue));
    console.log("session data: " + JSON.stringify(event.session.attributes));

    addNewAction(returnValue.listId, event, function(statusCode) {
      callback(statusCode);
      return;
    });
  });
};

/**
 * CreateListItem API to add an item to the List
 */
const addNewAction = function(listId, event, callback) {
  console.log("prepare API call to add task to list");

  var consent_token = event.session.user.permissions.consentToken;

  var path = "/v2/householdlists/_listId_/items";
  path = path.replace("_listId_", listId);

  console.log("path:" + path);

  // create the task name based on the slots provided
  // CAROLINE I HAVE NO IDEA WHAT THIS IS PLEASE LOOK BELOW AND EDIT AS NEEDED
  var tasks =
    event.request.intent.slots.reps.value +
    " x " +
    event.request.intent.slots.tasks.value;

  if (event.request.intent.slots.weight.value) {
    tasks += " @ " + event.request.intent.slots.weight.value + " lbs";
  }

  var postData = {
    value: tasks, //item value, with a string description up to 256 characters
    status: "active" // item status (Enum: "active" or "completed")
  };

  //var consent_token = session.user.permissions.consentToken;

  var options = {
    host: api_url,
    port: api_port,
    path: path,
    method: "POST",
    headers: {
      Authorization: "Bearer " + consent_token,
      "Content-Type": "application/json"
    }
  };

  var req = https
    .request(options, res => {
      console.log("statusCode:", res.statusCode);
      console.log("headers:", res.headers);

      res.on("data", d => {
        console.log("data: " + d);
        //    process.stdout.write(d);
      });
      res.on("error", e => {
        console.log("error received");
        console.error(e);
      });
      res.on("end", function() {
        callback(res.statusCode);
        return;
      });
    })
    .end(JSON.stringify(postData));
};

/**
 * List API to retrieve the List of Lists : Lists Metadata.
 */
const getListsMetadata = function(session, callback) {
  if (!session.user.permissions) {
    console.log("permissions are not defined");
    callback(null);
    return;
  }
  consent_token = session.user.permissions.consentToken;
  console.log("Starting the get list metadata call.");
  var options = {
    host: api_url,
    port: api_port,
    path: "/v2/householdlists/",
    method: "GET",
    headers: {
      Authorization: "Bearer " + consent_token,
      "Content-Type": "application/json"
    }
  };

  var req = https
    .request(options, res => {
      console.log("STATUS: ", res.statusCode);
      console.log("HEADERS: ", JSON.stringify(res.headers));

      if (res.statusCode === 403) {
        console.log("permissions are not granted");
        callback(null);
        return;
      }

      var body = [];
      res
        .on("data", function(chunk) {
          body.push(chunk);
        })
        .on("end", function() {
          body = Buffer.concat(body).toString();
          callback(body);
        });

      res.on("error", e => {
        console.log(`Problem with request: ${e.message}`);
      });
    })
    .end();
};

/**
 * List API to retrieve the customer to-do list.
 */
const getToDoList = function(session, callback) {
  if (!session.user.permissions) {
    console.log("permissions are not defined");
    callback(null);
    return;
  }
  consent_token = session.user.permissions.consentToken;
  console.log("Starting get todo list call.");

  getListsMetadata(session, function(returnValue) {
    if (!returnValue) {
      console.log("permissions are not defined");
      callback(null);
      return;
    }
    var obj = JSON.parse(returnValue);
    var todo_path = "";
    for (i = 0; i < obj.lists.length; i++) {
      if (obj.lists[i].name === "tasks list Tracker") {
        for (j = 0; j < obj.lists[i].statusMap.length; j++) {
          if (obj.lists[i].statusMap[j].status === "active") {
            todo_path = obj.lists[i].statusMap[j].href;
            break;
          }
        }
        break;
      }
    }

    var options = {
      host: api_url,
      port: api_port,
      path: todo_path,
      method: "GET",
      headers: {
        Authorization: "Bearer " + consent_token,
        "Content-Type": "application/json"
      }
    };

    var req = https
      .request(options, res => {
        console.log("STATUS: ", res.statusCode);
        console.log("HEADERS: ", JSON.stringify(res.headers));

        if (res.statusCode === 403) {
          console.log("permissions are not granted");
          callback(null);
          return;
        }

        var body = [];
        res
          .on("data", function(chunk) {
            body.push(chunk);
          })
          .on("end", function() {
            body = Buffer.concat(body).toString();
            callback(JSON.parse(body));
          });

        res.on("error", e => {
          console.log(`Problem with request: ${e.message}`);
        });
      })
      .end();
  });
};

/**
 * Helper function to retrieve the top to-do item.
 */
const getTopToDoItem = function(session, callback) {
  getToDoList(session, function(returnValue) {
    if (!returnValue) {
      callback(null);
    } else if (!returnValue.items || returnValue.items.length === 0) {
      callback(list_is_empty);
    } else {
      callback(returnValue.items[0].value);
    }
  });
};

/**
 * List API to delete the top todo item.
 */
const clearTopToDoAction = function(session, callback) {
  getToDoList(session, function(returnValue) {
    if (!returnValue) {
      callback(null);
      return;
    } else if (!returnValue.items || returnValue.items.length === 0) {
      callback(list_is_empty);
      return;
    }

    if (!session.user.permissions) {
      console.log("permissions are not defined");
      callback(null);
      return;
    }
    consent_token = session.user.permissions.consentToken;

    var path = "/v2/householdlists/_listId_/items/_itemId_";
    path = path.replace("_listId_", returnValue.listId);
    path = path.replace("_itemId_", returnValue.items[0].id);

    var options = {
      host: api_url,
      port: api_port,
      path: path,
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + consent_token,
        "Content-Type": "application/json"
      }
    };

    var req = https
      .request(options, res => {
        console.log("STATUS: ", res.statusCode);
        console.log("HEADERS: ", JSON.stringify(res.headers));

        if (res.statusCode === 403) {
          console.log("permissions are not granted");
          callback(null);
          return;
        }

        var body = [];
        res
          .on("data", function(chunk) {
            body.push(chunk);
          })
          .on("end", function() {
            body = Buffer.concat(body).toString();
            callback(res.statusCode);
          });

        res.on("error", e => {
          console.log(`Problem with request: ${e.message}`);
        });
      })
      .end();
  });
};

// Define events and intents
const NEW_SESSION = "NewSession";
const LAUNCH_REQUEST = "LaunchRequest";
const SESSION_ENDED = "SessionEndedRequest";
const UNHANDLED = "Unhandled";

const TOP_TODO_INTENT = "TopToDoIntent";
const CLEAR_TOP_TODO_INTENT = "ClearTopToDoIntent";
const NEW_LIST_INTENT = "newtasks list";
const LIST_TASKS_INTENT = "listtasks";
const LIST_TASKS_WEEK_INTENT = "tasksWEEK";
const EXPLAIN_TASK_INTENT = "explaintasks";
const AMAZON_HELP = "AMAZON.HelpIntent";
const AMAZON_CANCEL = "AMAZON.CancelIntent";
const AMAZON_STOP = "AMAZON.StopIntent";

const handlers = {};

// Event handlers
handlers[NEW_SESSION] = newSessionRequestHandler;
handlers[LAUNCH_REQUEST] = launchRequestHandler;
handlers[SESSION_ENDED] = sessionEndedRequestHandler;
handlers[UNHANDLED] = unhandledRequestHandler;

// Intent handlers
handlers[TOP_TODO_INTENT] = topToDoHandler;
handlers[CLEAR_TOP_TODO_INTENT] = clearTopToDoHandler;
handlers[NEW_LIST_INTENT] = addListHandler;
handlers[LIST_TASKS_INTENT] = listTasksHandler;
handlers[LIST_TASKS_WEEK_INTENT] = listTasksForWeek;
handlers[EXPLAIN_TASKS_INTENT] = explaintasks;

handlers[AMAZON_CANCEL] = amazonCancelHandler;
handlers[AMAZON_STOP] = amazonStopHandler;
handlers[AMAZON_HELP] = amazonHelpHandler;
