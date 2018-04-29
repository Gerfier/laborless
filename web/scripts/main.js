/**
 * Copyright 2018 noBrainers. All Rights Reserved.
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

// Shortcuts to DOM Elements.
var listeningFirebaseRefs = [];
var departmentid;

/**
 * The ID of the currently signed-in User. We keep track of this to detect Auth state change events that are just
 * programmatic token refresh but not a User status change.
 */
var currentUID;




/**
 * Used by employer to post job to database.
 */
function postJob() {
  console.log("postJob()");
  //var categoriesModal = document.getElementById('categoriesModal');
  $('#categoriesModal').modal('hide');

  console.log(departmentid);

  var postData = {
    jobName: document.getElementById('job-title').value,
    jobDescription: document.getElementById('job-description').value,
    status: "incomplete",
    requestedBy: firebase.auth().currentUser.uid,
    department_id: departmentid
  };

  //department_id can be: house, auto, pet, cleaning

  //get a key for a new post 
  var newPostKey = firebase.database().ref().child('posts').push().key;

  var updates = {};
  updates['/Jobs/' + newPostKey] = postData;
  return firebase.database().ref().update(updates);

}


/**
 * This function is called by setDeptHome, setDeptAuto, setDeptPet, and setDeptClean.
 * It records the job category selected by an employer so that when a job is posted,
 * it can go into the appropriate category.
 * 
 * @param {*} id The employer's selected job category; one of house, auto, pet, cleaning
 */
function setDepartmentId(id) {
  console.log("setDepartmentId()");
  departmentid = id;
  $('#postJobModal').modal('show');
}


/**
 * The following four functions are called by employerPage.html.
 */
function setDeptHome() {
  console.log("setDeptHome()");
  setDepartmentId("house");
}

function setDeptAuto() {
  console.log("setDeptAuto()");
  setDepartmentId("auto");
}

function setDeptPet() {
  console.log("setDeptPet()");
  setDepartmentId("pet");
}

function setDeptClean() {
  console.log("setDeptClean()");
  setDepartmentId("cleaning");
}


/**
 * Called when student clicks 'Elect' button on a job
 * Queues the student for work on that job in the database.
 * 
 * @param {*} jobid database key of given job
 */
function electForJob(jobid) {
  console.log("electForJob(" + jobid + ")");
  if (firebase.auth().currentUser) {
    var currentUID = firebase.auth().currentUser.uid;
    console.log(currentUID);
    /*var postData = {
      jobName: document.getElementById('job-title').value,
      jobDescription: document.getElementById('job-description').value,
      status: "incomplete",
      requestedBy: firebase.auth().currentUser.uid,
      department_id: departmentid
    };*/

    //get a key for a new post 
    var newPostKey = firebase.database().ref().child('posts').push().key;

    var updates = {};
    updates['/Jobs/' + jobid + '/queuedWorkers/' + newPostKey] = currentUID;
    firebase.database().ref().update(updates);

    if (endsWith(window.location.pathname, "studentCar.html")) {
      window.location = '/studentPage/studentCategories/studentCar.html';
    }
    else if (endsWith(window.location.pathname, "studentClean.html")) {
      window.location = '/studentPage/studentCategories/studentClean.html';
    }
    else if (endsWith(window.location.pathname, "studentHome.html")) {
      window.location = '/studentPage/studentCategories/studentHome.html';
    }
    else if (endsWith(window.location.pathname, "studentPets.html")) {
      window.location = '/studentPage/studentCategories/studentPets.html';
    }
  }
}

/**
 * Called by getJobsByCategory() for every valid job returned from the database.
 * Prints the cards for each job passed to it to the page.
 * 
 * @param {*} jobTitle 
 * @param {*} jobDesc 
 * @param {*} requestedBy Database key of user which posted the job
 * @param {*} departmentid One of house, auto, pet, or cleaning
 * @param {*} jobid Database key for given job
 */
function displayJobToStudent(jobTitle, jobDesc, requestedBy, departmentid, jobid) {
  console.log("displayJobToStudent()");
  console.log("user: " + requestedBy);
  firebase.database().ref('users/' + requestedBy).once('value').then(function (snapshot) {
    if (snapshot.val()) {
      var username = snapshot.val().username;

      var card = '<div class="card">';
      //department_id can be: house, auto, pet, cleaning
      if (departmentid == "house") {
        card += '<img class="card-img-top" src="/img/house.jpg" alt="home-image">';
      } else if (departmentid == "auto") {
        card += '<img class="card-img-top" src="/img/auto.jpg" alt="auto-image">';
      } else if (departmentid == "pet") {
        card += '<img class="card-img-top" src="/img/pet.jpg" alt="pet-image">';
      } else if (departmentid == "cleaning") {
        card += '<img class="card-img-top" src="/img/cleaning.jpg" alt="clean-image">';
      }

      card +=
        '<div class="card-body">' +
        '<h5 class="card-title">' + jobTitle + '</h5>' +
        '<p class="card-text">' + jobDesc + '</p>' +
        '<span ' +
        '  data-target="#exampleUserProfile" ' +
        '  data-toggle="modal" ' +
        '  data-toggle="tooltip" ' +
        '  data-placement="bottom" ' +
        '  onclick="showProfileModal(\'' + username + '\');"' +
        '  title="View User Profile" ' +
        '  >' +
        '    <i class="fas fa-address-card option-icon"></i>' +
        '</span>' +
        '<button ' +
        '  type="button" ' +
        '  onclick="electForJob(\'' + jobid + '\')" ' +
        '  class="btn btn-outline-primary px-4">Elect</button>' +
        '</div>' +
        '</div>';

      //append new job as first child
      $('#jobPost-row').prepend(card);

      /*  '<div id=job-card class="col-lg-3 col-md-6 col-sm-12">'
        + '<div class="card" mx-auto>'
        + '<div class="card-body">'
        + '<h4 class="card-title">' + jobTitle + '</h4>'
        + '<p class="card-text" style="padding-top: 3rem;">' + jobDesc + '</p>'
        //email of course will be modified later to be only visible when employer hires a student 
        //otherwise nobody can see it
        + '<p class="card-text-owner">' + requestedBy + '</p>'
        + '</div>'
        + '</div>'
        + '</div>');
      */
      console.log("posted.");
    }
  });
}




function deleteJob(jobid) {
  firebase.database().ref('Jobs').child(jobid).remove();

  if (endsWith(window.location.pathname, "myJobs.html")) {
    window.location = '/employerPage/myJobs.html';
  }
  else if (endsWith(window.location.pathname, "completedJobs.html")) {
    window.location = '/employerPage/completedJobs.html';
  }
}



function markJobCompleted(jobid) {
  var updates = {};
  updates['/Jobs/' + jobid + "/status"] = "complete";
  firebase.database().ref().update(updates);

  if (endsWith(window.location.pathname, "myJobs.html")) {
    window.location = '/employerPage/myJobs.html';
  }
  else if (endsWith(window.location.pathname, "completedJobs.html")) {
    window.location = '/employerPage/completedJobs.html';
  }
}





/**
 * For each job passed to this function, a card is formed and placed on the page
 * for the employer user.
 * 
 * @param {*} jobTitle 
 * @param {*} jobDesc 
 * @param {*} jobCat One of house, auto, pet, cleaning
 * @param {*} requestedBy Should be the employer's username
 * @param {*} jobid The database key of the job
 * @param {*} showCompletedJobs True if completed jobs are being shown; False if incomplete jobs are being shown
 * @param {*} workers Array of queued workers on the job
 */
function displayJobToEmployer(jobTitle, jobDesc, jobCat, requestedBy, jobid, showCompletedJobs, workers) {
  console.log("displayIncompletedJobToEmployer()");
  console.log("user: " + requestedBy);
  //append new job as first child
  /* Old version 
  $('#jobPost-row').prepend('<div id=job-card class="col-lg-3 col-md-6 col-sm-12">'
    + '<div class="card" mx-auto>'
    + '<div class="card-body">'
    + '<h4 class="card-title">' + jobTitle + '</h4>'
    + '<p class="card-text" style="padding-top: 3rem;">' + jobDesc + '</p>'
    //email of course will be modified later to be only visible when employer hires a student 
    //otherwise nobody can see it
    + '<p class="card-text-owner">' + requestedBy + '</p>'
    + '</div>'
    + '</div>'
    + '</div>');
    */

  var card = '<div class="card" max-width="256px">';
  //department_id can be: house, auto, pet, cleaning
  if (jobCat == "house") {
    card += '<img class="card-img-top" src="/img/house.jpg" alt="home-image">';
  } else if (jobCat == "auto") {
    card += '<img class="card-img-top" src="/img/auto.jpg" alt="auto-image">';
  } else if (jobCat == "pet") {
    card += '<img class="card-img-top" src="/img/pet.jpg" alt="pet-image">';
  } else if (jobCat == "cleaning") {
    card += '<img class="card-img-top" src="/img/cleaning.jpg" alt="clean-image">';
  }

  card +=
    '<div class="card-body">' +
    '<h4 class="card-title">' + jobTitle + '</h4>' +
    '<p class="card-text" style="padding-top: 1rem;">' + jobDesc + '</p>' +
    '</div>' +
    '<div class="card-options">' +
    '<span data-toggle="tooltip" ' +
    '    data-placement="bottom" ' +
    '    onclick="deleteJob(\'' + jobid + '\');"' +
    '    title="Delete Post"> ' +
    ' <i class="fas fa-trash-alt option-icon"></i> ' +
    '</span>';

  if (showCompletedJobs) {
    card += '<span data-toggle="tooltip" data-placement="bottom" title="Student Hired"><i class="fas fa-eye option-icon"></i></span> ';
  } else {
    card +=
      '<span data-toggle="modal" ' +
      '      data-placement="bottom" ' +
      '      data-target="#hiringModal"> ' +
      '          <a data-toggle="tooltip" ' +
      '             data-placement="bottom" ' +
      '             title="See who is interested" ' +
      '             onclick="showWorkerQueueModal(\'' + workers + '\', \'' + jobid + '\');"' +
      '             class="fas fa-eye option-icon"> ' +
      '          </a> ' +
      '</span>' +
      '<span data-toggle="tooltip" ' +
      '    data-placement="bottom" ' +
      '    onclick="markJobCompleted(\'' + jobid + '\');"' +
      '    title="Mark Job as Completed"> ' +
      '  <i class="fas fa-check-circle option-icon"></i> ' +
      '</span>';
  }

  card +=
    '</div>' +
    '</div>';

  $('#jobPost-row').prepend(card);
  console.log("posted.");
}



/**
 * This function creates the list of workers queued for each job.
 * It is used by the employer myJobs.html
 * @param {*} workers The list of workers queued for the selected job
 */
function showWorkerQueueModal(workers, jobid) {
  console.log("showWorkerQueueModal(" + workers + ")");
  console.log("jobid: "+jobid);
  //var profilemodal = document.getElementById('student-username');
  //profilemodal.innerText = workers;

  workers = workers.split(',');
  console.log("workers.length: " + workers.length);

  var hiringmodal = document.getElementById('hiringModalContent');

  //clean up results from previous lookups
  while (hiringmodal.childElementCount > 1) {
    hiringmodal.removeChild(hiringmodal.lastChild);
  }

  //hiringmodal
  //$('#hiringModalContent').remove()


  var listWithUsername = function(workerid, jobid) { 
    getUsernameOfId(workerid).then(function (username) {
      if (username) {
        console.log("username: " + username);
        console.log("workerid: " + workerid);
        console.log("jobid: "+jobid);
        var entry = '' +
          '<div class="modal-body"> ' +
          '<a href="#" ' +
          '   id="student-username" ' +
          '   data-toggle="modal" ' +
          '   data-target="#studentInfo" ' +
          '   data-dismiss="modal" ' +
          '   onclick="showWorkerProfile(\'' + workerid + '\', \'' + username + '\', \'' + jobid + '\');"' +
          '   style="color:black !important; font-size:1.2rem !important">' +
          username
        '</a> ' +
          '</div>';
        $('#hiringModalContent').append(entry);
      } else {
        var entry = '' +
          '<div class="modal-body"> ' +
          'No users have elected to do this job, yet.' +
          '</div>';
        $('#hiringModalContent').append(entry);
      }
    });
    
  }    

  for (var i = 0; i < workers.length; i++) {
    listWithUsername(workers[i], jobid);
  }
}



function showWorkerProfile(workerid, username, jobid) {
  console.log("showWorkerProfile(" + workerid + ")");
  var profilemodal = document.getElementById('exampleModalLongTitle');
  profilemodal.innerText = username + "\'s Information";
  //var selectbtn = document.getElementById('selectUserBtn');
  var footer = document.getElementById('studentInfoModalFooter');
  footer.innerHTML = '' +
  /*<button type="button" class="close" data-toggle="modal" data-target="#hiringModal" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">×</span>
                        </button>*/
    '<button id="selectUserBtn" ' +
    '        type="button" ' +
    '        data-dismiss="modal" ' +
    '        onclick="selectUserForJob(\''+workerid+ '\',\'' + jobid + '\')" ' +
    '        class="btn btn-outline-primary"> ' +
    'Select' +
    '</button>';
  //selectbtn.addEventListener('click', selectUserForJob(workerid, jobid), false);
}






function selectUserForJob(workerid, jobid) {
  console.log("selectUserForJob("+workerid+", "+jobid+")");
  var updates = {};
  updates['/Jobs/' + jobid + "/completedBy"] = workerid;

  var newPostKey = firebase.database().ref().child('posts').push().key;

  updates = {};
  updates['/users/' + workerid + '/approvedJobs/' + newPostKey] = jobid;
  firebase.database().ref().update(updates);

  $('#hiringModal').modal('hide');

  return firebase.database().ref().update(updates);


}


function getUsernameOfId(uid) {
  var username = firebase.database().ref('users/' + uid).once('value').then(function (snapshot) {
    return snapshot.val().username;
  });
  return username;
}



/**
 * Sets the employer profile modal contents when a student clicks the 
 * profile button on a job.
 * 
 * @param {*} requestedBy The username of the job poster
 */
function showProfileModal(requestedBy) {
  console.log("showProfileModal(" + requestedBy + ")");
  var profilemodal = document.getElementById('exampleModalLongTitle');
  profilemodal.innerText = requestedBy + "\'s Profile";
}









function fetchWorkers(workersRef, jobid) {
  var workers = [];
  workersRef.on('child_added', function (data) {
    console.log("worker child added: ");
    console.log(data.key);
    console.log(JSON.stringify(data.val(), null, '  '));

    //clean up previous sloppiness
    //check if worker already exists in our array; if so, remove it from db and fail to push
    console.log("location of this worker in our array: " + workers.indexOf(data.val()));
    if (workers.indexOf(data.val()) == -1) {
      console.log("worker is new; adding");
      workers.push(data.val());
    } else {
      console.log("worker is a duplicate; removing");
      removeWorkerKeyFromJob(data.key, jobid);
    }
  });
  return workers;
}




/**
 * Called by initApp() when student is viewing job category
 * Loads all jobs in the selected category
 */
function getJobsByCategory(desiredcategory) {
  console.log('getJobsByCategory()');
  var jobsRef = firebase.database().ref('Jobs');
  var jobPostsSection = document.getElementById('jobPost-row');

  //clear out the dummy element
  //$("#job-card").remove();
  //$("#jobPost-row").empty();
  var profileid = 0;


  var fetchPosts = function (postsRef, sectionElement) {

    postsRef.on('child_added', function (data) {
      console.log("child added: ");
      console.log(data.key);
      console.log(JSON.stringify(data.val(), null, '  '));

      /*
      {
        "department_id": "pet",
        "jobDescription": "My puppies need to be walked every Tuesday at 6 PM",
        "jobName": "Walk 2 Dogs",
        "jobPicture": "https://firebasestorage.googleapis.com/v0/b/laborless-6d04f.appspot.com/o/dogs.jpg?alt=media&token=59606a5b-687f-49b1-82e2-f9583fc105f7",
        "requestedBy": "y0ixAWrVCSbCsKH2rvCcn7dQAeC3",
        "status": "incomplete"
      }
      */

      var uid = firebase.auth().currentUser.uid;
      var requestedBy = data.val().requestedBy;
      var jobcategory = data.val().department_id;

      if (jobcategory === desiredcategory) {
        profileid++;
        console.log("Found a job in this category.");
        var jobTitle = data.val().jobName; //$("#job-title").val();
        var jobDesc = data.val().jobDescription; //$("#job-description").val();
        //displayJob(jobTitle, jobDesc, requestedBy);

        firebase.database().ref('users/' + uid).once('value').then(function (snapshot) {
          var username = snapshot.val().username;

          console.log("username: " + username);
          var status = data.val().status;

          //only show incomplete jobs
          if (status === "incomplete") {
            var jobPicture = data.val().jobPicture;
            var department_id = data.val().department_id;

            var workersRef = firebase.database().ref('Jobs/' + data.key + "/queuedWorkers");
            var workers = fetchWorkers(workersRef, data.key);
            console.log("workers: " + workers)

            //check if this user is already queued for this job
            if (workers.indexOf(currentUID) == -1) {
              displayJobToStudent(jobTitle, jobDesc, requestedBy, department_id, data.key);
              $("#job-card-dyn").show();
            } else {
              console.log("User has already elected to do this job.");
            }



          }


        });

        //requestedBy = null;
        //return firebase.database().ref('/users/' + userId).once('value').then(function (snapshot) {
        //  var username = (snapshot.val() && snapshot.val().username) || 'Anonymous';
        //requestedBy = firebase.auth().currentUser.username;


      }

    });
    postsRef.on('child_changed', function (data) {
      console.log("child changed");
    });
    postsRef.on('child_removed', function (data) {
      console.log("child removed");
    });

  };

  // Fetching and displaying all posts of each sections.
  console.log("fetching jobs");
  fetchPosts(jobsRef, jobPostsSection);

  $("#jobPost-row").remove("#job-card");

  // Keep track of all Firebase refs we are listening to.
  listeningFirebaseRefs.push(jobsRef);
}



/**
 * Used to remove duplicate workers in worker queue
 * 
 * @param {*} workerkey 
 * @param {*} jobid 
 */
function removeWorkerKeyFromJob(workerkey, jobid) {
  console.log("removeWorkerFromJob(" + workerkey + ", " + jobid + ")");
  firebase.database().ref('Jobs/' + jobid + '/queuedWorkers').child(workerkey).remove();
}



/**
 * Called by initApp when employer is on myJobs.html
 * Loads the jobs posted by that user
 * 
 *  * @param {*} showCompletedOnly If true, only show completed jobs; If false, show only incomplete.
 */
function getMyJobs(showCompletedOnly) {
  console.log('getMyJobs()');
  var jobsRef = firebase.database().ref('Jobs');
  var jobPostsSection = document.getElementById('jobPost-row');

  //clear out the dummy element
  //$("#job-card").remove();
  //$("#jobPost-row").empty();


  var fetchPosts = function (postsRef, sectionElement) {

    postsRef.on('child_added', function (data) {
      console.log("child added: ");
      console.log(JSON.stringify(data.val(), null, '  '));

      /*
      {
        "department_id": "pet",
        "jobDescription": "My puppies need to be walked every Tuesday at 6 PM",
        "jobName": "Walk 2 Dogs",
        "jobPicture": "https://firebasestorage.googleapis.com/v0/b/laborless-6d04f.appspot.com/o/dogs.jpg?alt=media&token=59606a5b-687f-49b1-82e2-f9583fc105f7",
        "requestedBy": "y0ixAWrVCSbCsKH2rvCcn7dQAeC3",
        "status": "incomplete"
      }
      */

      var uid = firebase.auth().currentUser.uid;
      var requestedBy = data.val().requestedBy;

      if (requestedBy === uid) {
        console.log("Found a job by this user.");
        var jobTitle = data.val().jobName; //$("#job-title").val();
        var jobDesc = data.val().jobDescription; //$("#job-description").val();
        //displayJob(jobTitle, jobDesc, requestedBy);

        firebase.database().ref('users/' + uid).once('value').then(function (snapshot) {
          requestedBy = snapshot.val().username;

          var status = data.val().status;
          console.log("status: " + status);
          var jobPicture = data.val().jobPicture;
          var department_id = data.val().department_id;

          if ((showCompletedOnly && status === "complete") || (!showCompletedOnly && status === "incomplete")) {
            var workersRef = firebase.database().ref('Jobs/' + data.key + "/queuedWorkers");
            var workers = fetchWorkers(workersRef, data.key);
            console.log("workers: " + workers)
            displayJobToEmployer(jobTitle, jobDesc, department_id, requestedBy, data.key, showCompletedOnly, workers);
          }


          $("#job-card-dyn").show();

        });
        //return firebase.database().ref('/users/' + userId).once('value').then(function (snapshot) {
        //  var username = (snapshot.val() && snapshot.val().username) || 'Anonymous';
        //requestedBy = firebase.auth().currentUser.username;


      }

    });
    postsRef.on('child_changed', function (data) {
      console.log("child changed");
    });
    postsRef.on('child_removed', function (data) {
      console.log("child removed");
    });

  };

  // Fetching and displaying all posts of each sections.
  console.log("fetching jobs");
  fetchPosts(jobsRef, jobPostsSection);

  $("#jobPost-row").remove("#job-card");

  // Keep track of all Firebase refs we are listening to.
  listeningFirebaseRefs.push(jobsRef);
}




//TODO: finish this
function getMyAcceptedJobs() {
  console.log('getMyAcceptedJobs()');

  /*
  updates = {};
  updates['/users/' + workerid + '/approvedJobs/' + newPostKey] = jobid;
  */

  var jobsRef = firebase.database().ref('/users/'+currentUID+'/approvedJobs');
  var jobPostsSection = document.getElementById('jobPost-row');

  //clear out the dummy element
  //$("#job-card").remove();
  //$("#jobPost-row").empty();


  var fetchPosts = function (postsRef, sectionElement) {

    postsRef.on('child_added', function (data) {
      console.log("child added: ");
      console.log(JSON.stringify(data.val(), null, '  '));

      /*
      {
        "department_id": "pet",
        "jobDescription": "My puppies need to be walked every Tuesday at 6 PM",
        "jobName": "Walk 2 Dogs",
        "jobPicture": "https://firebasestorage.googleapis.com/v0/b/laborless-6d04f.appspot.com/o/dogs.jpg?alt=media&token=59606a5b-687f-49b1-82e2-f9583fc105f7",
        "requestedBy": "y0ixAWrVCSbCsKH2rvCcn7dQAeC3",
        "status": "incomplete"
      }
      */

      var uid = firebase.auth().currentUser.uid;
      var requestedBy = data.val().requestedBy;

      if (requestedBy === uid) {
        console.log("Found a job by this user.");
        var jobTitle = data.val().jobName; //$("#job-title").val();
        var jobDesc = data.val().jobDescription; //$("#job-description").val();
        //displayJob(jobTitle, jobDesc, requestedBy);

        firebase.database().ref('users/' + uid).once('value').then(function (snapshot) {
          requestedBy = snapshot.val().username;

          var status = data.val().status;
          console.log("status: " + status);
          var jobPicture = data.val().jobPicture;
          var department_id = data.val().department_id;

          if ((showCompletedOnly && status === "complete") || (!showCompletedOnly && status === "incomplete")) {
            var workersRef = firebase.database().ref('Jobs/' + data.key + "/queuedWorkers");
            var workers = fetchWorkers(workersRef, data.key);
            console.log("workers: " + workers)
            displayJobToEmployer(jobTitle, jobDesc, department_id, requestedBy, data.key, showCompletedOnly, workers);
          }


          $("#job-card-dyn").show();

        });
        //return firebase.database().ref('/users/' + userId).once('value').then(function (snapshot) {
        //  var username = (snapshot.val() && snapshot.val().username) || 'Anonymous';
        //requestedBy = firebase.auth().currentUser.username;


      }

    });
    postsRef.on('child_changed', function (data) {
      console.log("child changed");
    });
    postsRef.on('child_removed', function (data) {
      console.log("child removed");
    });

  };

  // Fetching and displaying all posts of each sections.
  console.log("fetching jobs");
  fetchPosts(jobsRef, jobPostsSection);

  $("#jobPost-row").remove("#job-card");

  // Keep track of all Firebase refs we are listening to.
  listeningFirebaseRefs.push(jobsRef);
}






/**
 * Called by initApp() when student is on main student page
 * Meant to load username and ratings.
 */
function handleStudentPageData() {
  console.log("handleStudentPageData()");
  var uid = firebase.auth().currentUser.uid;
  firebase.database().ref('users/' + uid).once('value').then(function (snapshot) {
    var username = snapshot.val().username;
    console.log("username: " + username);

    document.getElementById('greeting').innerHTML = "<h2>Hi " + username + "!</h2>";

    //$("#job-card-dyn").show();

  });
}



/**
 * The following cookie functions are used by 
 * onAuthStateChanged() and handleEmployerSignUp()
 * in order to properly establish usernames on accounts.
 */
function setCookie(name, value, days) {
  console.log("ESTABLISHING COOKIE");
  var expires = "";
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

function eraseCookie(name) {
  console.log("ERASING COOKIE");
  document.cookie = name + '=; Max-Age=-99999999;';
}




/**
 * Triggers every time there is a change in the Firebase auth state (i.e. user signed-in or user signed out).
 * Initialized by initApp()
 */
function onAuthStateChanged(user) {
  console.log("onAuthStateChanged(user)");

  // We ignore token refresh events.
  if (user && currentUID === user.uid) {
    console.log("Ignoring token refresh event");
    return;
  }

  //cleanupUi();
  //document.getElementById('quickstart-verify-email').disabled = true;

  if (user) { // User is signed in.
    console.log("User is signed in.");

    var displayName = user.displayName;
    var email = user.email;
    var emailVerified = user.emailVerified;
    var photoURL = user.photoURL;
    var isAnonymous = user.isAnonymous;
    var uid = user.uid;
    var providerData = user.providerData;
    var bgcstatus = user.backgroundCheckStatus;


    /*
        document.getElementById('quickstart-sign-in-status').textContent = 'Signed in';
        signInQS.textContent = 'Sign out';
        document.getElementById('quickstart-account-details').textContent = JSON.stringify(user, null, '  ');
        if (!emailVerified) {
          verifyEmail.disabled = false;
        }
    */

    console.log(JSON.stringify(user, null, '  '));

    //if(typeof bgcstatus == 'undefined') { //first time user is logging in

    //this block handles establishing initial account details on first login
    var notfirsttime = getCookie('establishedaccount');
    if (notfirsttime == 'false') { //first time user is logging in
      console.log("First login for user");

      var desiredUsername = getCookie('desiredusername');
      console.log("username from cookie: " + desiredUsername);
      eraseCookie('desiredusername');

      if (desiredUsername) {
        console.log("Initializing user data.");
        bgcstatus = "incomplete";
        //writeUserData(user.uid, user.displayName, user.email, user.photoURL, bgcstatus);
        firebase.database().ref('users/' + uid).set({
          username: desiredUsername,
          email: email,
          //profilePicture: imageUrl,
          backgroundCheckStatus: bgcstatus
        });

        user.updateProfile({
          displayName: desiredUsername
        }).then(function () {
          //update successful
          setCookie('establishedaccount', 'true', 1);
        }).catch(function (error) {
          //an error happened
        });
      } else {
        console.log("Did not initialize user.");
      }
    }


    //}

    currentUID = user.uid;
    //splashPage.style.display = 'none';
    //writeUserData(user.uid, user.displayName, user.email, user.photoURL, bgcstatus);
    //showSection(recentPostsSection, recentMenuButton);
    //startDatabaseQueries();

    //console.log(window.location.pathname.substring(0, 18));

    //if we were at a login page, decide where to go next
    if (window.location.pathname.substring(0, 18) === "/LogInSignUpPages/" ||
      window.location.pathname.substring(0, 10) === "/index.html" ||
      window.location.pathname === "/") {
      if (endsWith(email, "@ttu.edu")) {
        console.log("ttu email address");

        //check background check status
        firebase.database().ref('users/' + currentUID).once('value').then(function (snapshot) {
          var bgcstatus = snapshot.val().backgroundCheckStatus;
          console.log("bgcstatus: " + bgcstatus);
          if (bgcstatus === "passed") { //student passed background check
            window.location = "/studentPage/studentPage.html";
          } else {
            window.location = "/studentPage/studentBlock.html";
          }
        });
      } else {
        console.log("not ttu email address");
        window.location = "/employerPage/employerPage.html";
      }
    }

    if (endsWith(window.location.pathname, "studentPage.html")) {
      handleStudentPageData();
    }

  } else { // User is signed out.
    console.log("User is signed out.");
    //document.getElementById('quickstart-sign-in-status').textContent = 'Signed out';
    //signInQS.textContent = 'Sign in';
    //document.getElementById('quickstart-account-details').textContent = 'null';

    // Set currentUID to null.
    currentUID = null;
    // Display the splash page where you can sign-in.
    //splashPage.style.display = '';

    //if we were at one of the logged in pages
    if (window.location.pathname.substring(0, 13) === "/studentPage/" ||
      window.location.pathname.substring(0, 14) === "/employerPage/") {
      window.location = "/"; //go back home
    }
  }

  //signInQS.disabled = false;
}

function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}




/**
 * Handles sign in and sign out button press
 */
function toggleSignIn() {
  var signInQS = document.getElementById('loginBtn');

  //if user is signed in, button acts as sign out button
  if (firebase.auth().currentUser) {
    firebase.auth().signOut();
  } else { //otherwise, it's a sign in button
    var email = document.getElementById('inputEmail3').value;
    var password = document.getElementById('inputPassword3').value;
    if (email.length < 4) {
      alert('Please enter an email address.');
      return;
    }
    if (password.length < 4) {
      alert('Please enter a password.');
      return;
    }
    // Sign in with email and pass.
    firebase.auth().signInWithEmailAndPassword(email, password).catch(function (error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      // [START_EXCLUDE]
      if (errorCode === 'auth/wrong-password') {
        alert('Wrong password.');
      } else {
        alert(errorMessage);
      }
      console.log(error);
      signInQS.disabled = false;
      // [END_EXCLUDE]
    });
  }
  //signInQS.disabled = true;
}




function handleEmployerSignUp() {
  var email = document.getElementById('inputEmail3').value;
  var password = document.getElementById('inputPassword3').value;
  var desiredUsername = document.getElementById('inputUsername3').value;

  setCookie('desiredusername', desiredUsername, 1);
  setCookie('establishedaccount', 'false', 1);

  console.log("handleEmployeeSignUp()");
  console.log(email);
  console.log(password);
  console.log(desiredUsername);

  //TODO: check if username is taken

  if (email.length < 4) {
    alert('Please enter an email address.');
    return;
  }
  if (password.length < 4) {
    alert('Please enter a password.');
    return;
  }
  // Sign in with email and pass.
  console.log("Attempting login...");

  firebase.auth().createUserWithEmailAndPassword(email, password).catch(function (error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    if (errorCode == 'auth/weak-password') {
      alert('The password is too weak.');
    } else {
      alert(errorMessage);
    }
    console.log(error);
    console.log(error.email + ' ' + error.credential + ' ' + error.code);
  });

  console.log("Done creating user.");
}

function handleEmployeeSignUp() {
  //TODO: do check for @ttu.edu email address
  handleEmployerSignUp();
}

/**
 * Sends an email verification to the user.
 */
function sendEmailVerification() {
  firebase.auth().currentUser.sendEmailVerification().then(function () {
    // Email Verification sent!
    alert('Email Verification Sent!');
  });
}

/**
 * Sends a password reset email to the user
 */
function sendPasswordReset() {
  var email = document.getElementById('emailInput').value;
  firebase.auth().sendPasswordResetEmail(email).then(function () {
    // Password Reset Email Sent!
    // [START_EXCLUDE]
    alert('Password Reset Email Sent!');
    // [END_EXCLUDE]
  }).catch(function (error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // [START_EXCLUDE]
    if (errorCode == 'auth/invalid-email') {
      alert(errorMessage);
    } else if (errorCode == 'auth/user-not-found') {
      alert(errorMessage);
    }
    console.log(error);
    // [END_EXCLUDE]
  });
}

/**
 * initApp handles setting up UI event listeners and registering Firebase auth listeners:
 *  - firebase.auth().onAuthStateChanged: This listener is called when the user is signed in or
 *    out, and that is where we update the UI.
 * 
 * In general, initApp() is put in the onload of every HTML page.
 */
function initApp() {

  console.log("initApp()");

  var config = {
    apiKey: "AIzaSyDFQ1cj9Hl-sMsmuqbVv7m53cKs7gObwrM",
    authDomain: "laborless-6d04f.firebaseapp.com",
    databaseURL: "https://laborless-6d04f.firebaseio.com",
    projectId: "laborless-6d04f",
    storageBucket: "laborless-6d04f.appspot.com",
    messagingSenderId: "801197496805"
  };
  firebase.initializeApp(config);

  var listeningFirebaseRefs = [];

  // Listening for auth state changes.
  console.log("Registering onAuthStateChanged listener");
  firebase.auth().onAuthStateChanged(onAuthStateChanged);

  // Bindings on load.
  /*window.addEventListener('load', function () {

  });*/

  //load list of jobs on employer jobs page
  if (endsWith(window.location.pathname, "myJobs.html")) {
    getMyJobs(false);
  }
  else if (endsWith(window.location.pathname, "completedJobs.html")) {
    getMyJobs(true);
  }

  else if (endsWith(window.location.pathname, "studentPage.html")) {
    getMyAcceptedJobs();
  }

  //load available jobs based on category for students viewing categories
  //department_id can be: house, auto, pet, cleaning
  else if (endsWith(window.location.pathname, "studentHome.html")) {
    getJobsByCategory("house");
  }
  else if (endsWith(window.location.pathname, "studentCar.html")) {
    getJobsByCategory("auto");
  }
  else if (endsWith(window.location.pathname, "studentClean.html")) {
    getJobsByCategory("cleaning");
  }
  else if (endsWith(window.location.pathname, "studentPets.html")) {
    getJobsByCategory("pet");
  }

  //redirect student to blocked page if they have not passed their background check
  else if (endsWith(window.location.pathname, "studentBlock.html")) {
    if (firebase.auth().currentUser) {
      var currentUID = firebase.auth().currentUser.uid;
      firebase.database().ref('users/' + currentUID).once('value').then(function (snapshot) {
        var bgcstatus = snapshot.val().backgroundCheckStatus;
        console.log("bgcstatus: " + bgcstatus);
        if (bgcstatus === "passed") { //student passed background check
          window.location = "/studentPage/studentPage.html";
        }
      });
    } else { //not logged in
      //window.location = "/";
    }
  }
}





/* END OF DOCUMENT */

/* TURN BACK */

/* ABANDON HOPE ALL YE WHO ENTER HERE */

/* ************************************************************************** */


/**
 * Cleanups the UI and removes all Firebase listeners.
 */
/*
function cleanupUi() {
  
    var recentPostsSection = document.getElementById('recent-posts-list');
    var userPostsSection = document.getElementById('user-posts-list');
    var topUserPostsSection = document.getElementById('top-user-posts-list');
  
    // Remove all previously displayed posts.
    topUserPostsSection.getElementsByClassName('posts-container')[0].innerHTML = '';
    recentPostsSection.getElementsByClassName('posts-container')[0].innerHTML = '';
    userPostsSection.getElementsByClassName('posts-container')[0].innerHTML = '';
  

  console.log("cleanupUi()");

  // Stop all currently listening Firebase listeners.
  listeningFirebaseRefs.forEach(function (ref) {
    ref.off();
  });
  listeningFirebaseRefs = [];
}
*/


/**
 * Displays the given section element and changes styling of the given button.
 */
/*
function showSection(sectionElement, buttonElement) {
  var addPost = document.getElementById('add-post');
  var recentPostsSection = document.getElementById('recent-posts-list');
  var userPostsSection = document.getElementById('user-posts-list');
  var topUserPostsSection = document.getElementById('top-user-posts-list');
  var recentMenuButton = document.getElementById('menu-recent');
  var myPostsMenuButton = document.getElementById('menu-my-posts');
  var myTopPostsMenuButton = document.getElementById('menu-my-top-posts');

  recentPostsSection.style.display = 'none';
  userPostsSection.style.display = 'none';
  topUserPostsSection.style.display = 'none';
  addPost.style.display = 'none';
  recentMenuButton.classList.remove('is-active');
  myPostsMenuButton.classList.remove('is-active');
  myTopPostsMenuButton.classList.remove('is-active');

  if (sectionElement) {
    sectionElement = sectionElement;
    sectionElement.style.display = 'block';
  }
  if (buttonElement) {
    buttonElement.classList.add('is-active');
  }
}
*/

/**
 * Creates a new post for the current user.
 */
/*
function newPostForCurrentUser(title, text) {
  // [START single_value_read]
  var userId = firebase.auth().currentUser.uid;
  return firebase.database().ref('/users/' + userId).once('value').then(function (snapshot) {
    var username = (snapshot.val() && snapshot.val().username) || 'Anonymous';
    // [START_EXCLUDE]
    return writeNewPost(firebase.auth().currentUser.uid, username,
      firebase.auth().currentUser.photoURL,
      title, text);
    // [END_EXCLUDE]
  });
  // [END single_value_read]
}
*/


/**
 * Starts listening for new posts and populates posts lists.
 */
/*function startDatabaseQueries() {
  var topUserPostsSection = document.getElementById('top-user-posts-list');
  var recentPostsSection = document.getElementById('recent-posts-list');
  var userPostsSection = document.getElementById('user-posts-list');

  console.log("startDatabaseQueries()");

  // [START my_top_posts_query]
  var myUserId = firebase.auth().currentUser.uid;
  var topUserPostsRef = firebase.database().ref('user-posts/' + myUserId).orderByChild('starCount');
  // [END my_top_posts_query]
  // [START recent_posts_query]
  var recentPostsRef = firebase.database().ref('posts').limitToLast(100);
  // [END recent_posts_query]
  var userPostsRef = firebase.database().ref('user-posts/' + myUserId);

  var fetchPosts = function (postsRef, sectionElement) {
    postsRef.on('child_added', function (data) {
      var author = data.val().author || 'Anonymous';
      var containerElement = sectionElement.getElementsByClassName('posts-container')[0];
      containerElement.insertBefore(
        createPostElement(data.key, data.val().title, data.val().body, author, data.val().uid, data.val().authorPic),
        containerElement.firstChild);
    });
    postsRef.on('child_changed', function (data) {
      var containerElement = sectionElement.getElementsByClassName('posts-container')[0];
      var postElement = containerElement.getElementsByClassName('post-' + data.key)[0];
      postElement.getElementsByClassName('mdl-card__title-text')[0].innerText = data.val().title;
      postElement.getElementsByClassName('username')[0].innerText = data.val().author;
      postElement.getElementsByClassName('text')[0].innerText = data.val().body;
      postElement.getElementsByClassName('star-count')[0].innerText = data.val().starCount;
    });
    postsRef.on('child_removed', function (data) {
      var containerElement = sectionElement.getElementsByClassName('posts-container')[0];
      var post = containerElement.getElementsByClassName('post-' + data.key)[0];
      post.parentElement.removeChild(post);
    });
  };

  // Fetching and displaying all posts of each sections.
  fetchPosts(topUserPostsRef, topUserPostsSection);
  fetchPosts(recentPostsRef, recentPostsSection);
  fetchPosts(userPostsRef, userPostsSection);

  // Keep track of all Firebase refs we are listening to.
  listeningFirebaseRefs.push(topUserPostsRef);
  listeningFirebaseRefs.push(recentPostsRef);
  listeningFirebaseRefs.push(userPostsRef);
}*/

/**
 * Writes the user's data to the database.
 */
/*function writeUserData(userId, name, email, imageUrl, bgcstatus) {
  console.log("writeUserData()");

  firebase.database().ref('users/' + userId).set({
    username: name,
    email: email,
    profilePicture: imageUrl,
    backgroundCheckStatus: bgcstatus
  });
}*/

/**
 * Saves a new post to the Firebase DB.
 */
/*function writeNewPost(uid, username, picture, title, body) {
  // A post entry.
  var postData = {
    author: username,
    uid: uid,
    body: body,
    title: title,
    starCount: 0,
    authorPic: picture
  };

  // Get a key for a new Post.
  var newPostKey = firebase.database().ref().child('posts').push().key;

  // Write the new post's data simultaneously in the posts list and the user's post list.
  var updates = {};
  updates['/posts/' + newPostKey] = postData;
  updates['/user-posts/' + uid + '/' + newPostKey] = postData;

  return firebase.database().ref().update(updates);
}*/


/*
function toggleStar(postRef, uid) {
  postRef.transaction(function (post) {
    if (post) {
      if (post.stars && post.stars[uid]) {
        post.starCount--;
        post.stars[uid] = null;
      } else {
        post.starCount++;
        if (!post.stars) {
          post.stars = {};
        }
        post.stars[uid] = true;
      }
    }
    return post;
  });
}
*/

/**
 * Creates a post element.
 */
/*
function createPostElement(postId, title, text, author, authorId, authorPic) {
  var uid = firebase.auth().currentUser.uid;

  var html =
    '<div class="post post-' + postId + ' mdl-cell mdl-cell--12-col ' +
    'mdl-cell--6-col-tablet mdl-cell--4-col-desktop mdl-grid mdl-grid--no-spacing">' +
    '<div class="mdl-card mdl-shadow--2dp">' +
    '<div class="mdl-card__title mdl-color--light-blue-600 mdl-color-text--white">' +
    '<h4 class="mdl-card__title-text"></h4>' +
    '</div>' +
    '<div class="header">' +
    '<div>' +
    '<div class="avatar"></div>' +
    '<div class="username mdl-color-text--black"></div>' +
    '</div>' +
    '</div>' +
    '<span class="star">' +
    '<div class="not-starred material-icons">star_border</div>' +
    '<div class="starred material-icons">star</div>' +
    '<div class="star-count">0</div>' +
    '</span>' +
    '<div class="text"></div>' +
    '<div class="comments-container"></div>' +
    '<form class="add-comment" action="#">' +
    '<div class="mdl-textfield mdl-js-textfield">' +
    '<input class="mdl-textfield__input new-comment" type="text">' +
    '<label class="mdl-textfield__label">Comment...</label>' +
    '</div>' +
    '</form>' +
    '</div>' +
    '</div>';

  // Create the DOM element from the HTML.
  var div = document.createElement('div');
  div.innerHTML = html;
  var postElement = div.firstChild;
  if (componentHandler) {
    componentHandler.upgradeElements(postElement.getElementsByClassName('mdl-textfield')[0]);
  }

  var addCommentForm = postElement.getElementsByClassName('add-comment')[0];
  var commentInput = postElement.getElementsByClassName('new-comment')[0];
  var star = postElement.getElementsByClassName('starred')[0];
  var unStar = postElement.getElementsByClassName('not-starred')[0];

  // Set values.
  postElement.getElementsByClassName('text')[0].innerText = text;
  postElement.getElementsByClassName('mdl-card__title-text')[0].innerText = title;
  postElement.getElementsByClassName('username')[0].innerText = author || 'Anonymous';
  postElement.getElementsByClassName('avatar')[0].style.backgroundImage = 'url("' +
    (authorPic || './silhouette.jpg') + '")';

  // Listen for comments.
  // [START child_event_listener_recycler]
  var commentsRef = firebase.database().ref('post-comments/' + postId);
  commentsRef.on('child_added', function (data) {
    addCommentElement(postElement, data.key, data.val().text, data.val().author);
  });

  commentsRef.on('child_changed', function (data) {
    setCommentValues(postElement, data.key, data.val().text, data.val().author);
  });

  commentsRef.on('child_removed', function (data) {
    deleteComment(postElement, data.key);
  });
  // [END child_event_listener_recycler]

  // Listen for likes counts.
  // [START post_value_event_listener]
  var starCountRef = firebase.database().ref('posts/' + postId + '/starCount');
  starCountRef.on('value', function (snapshot) {
    updateStarCount(postElement, snapshot.val());
  });
  // [END post_value_event_listener]

  // Listen for the starred status.
  var starredStatusRef = firebase.database().ref('posts/' + postId + '/stars/' + uid);
  starredStatusRef.on('value', function (snapshot) {
    updateStarredByCurrentUser(postElement, snapshot.val());
  });

  // Keep track of all Firebase reference on which we are listening.
  listeningFirebaseRefs.push(commentsRef);
  listeningFirebaseRefs.push(starCountRef);
  listeningFirebaseRefs.push(starredStatusRef);

  // Create new comment.
  addCommentForm.onsubmit = function (e) {
    e.preventDefault();
    createNewComment(postId, firebase.auth().currentUser.displayName, uid, commentInput.value);
    commentInput.value = '';
    commentInput.parentElement.MaterialTextfield.boundUpdateClassesHandler();
  };

  // Bind starring action.
  var onStarClicked = function () {
    var globalPostRef = firebase.database().ref('/posts/' + postId);
    var userPostRef = firebase.database().ref('/user-posts/' + authorId + '/' + postId);
    toggleStar(globalPostRef, uid);
    toggleStar(userPostRef, uid);
  };
  unStar.onclick = onStarClicked;
  star.onclick = onStarClicked;

  return postElement;
}
*/

/**
 * Writes a new comment for the given post.
 */
/*
function createNewComment(postId, username, uid, text) {
  firebase.database().ref('post-comments/' + postId).push({
    text: text,
    author: username,
    uid: uid
  });
}
*/

/**
 * Updates the starred status of the post.
 */
/*
function updateStarredByCurrentUser(postElement, starred) {
  if (starred) {
    postElement.getElementsByClassName('starred')[0].style.display = 'inline-block';
    postElement.getElementsByClassName('not-starred')[0].style.display = 'none';
  } else {
    postElement.getElementsByClassName('starred')[0].style.display = 'none';
    postElement.getElementsByClassName('not-starred')[0].style.display = 'inline-block';
  }
}
*/

/**
 * Updates the number of stars displayed for a post.
 */
/*
function updateStarCount(postElement, nbStart) {
  postElement.getElementsByClassName('star-count')[0].innerText = nbStart;
}
*/

/**
 * Creates a comment element and adds it to the given postElement.
 */
/*
function addCommentElement(postElement, id, text, author) {
  var comment = document.createElement('div');
  comment.classList.add('comment-' + id);
  comment.innerHTML = '<span class="username"></span><span class="comment"></span>';
  comment.getElementsByClassName('comment')[0].innerText = text;
  comment.getElementsByClassName('username')[0].innerText = author || 'Anonymous';

  var commentsContainer = postElement.getElementsByClassName('comments-container')[0];
  commentsContainer.appendChild(comment);
}
*/

/**
 * Sets the comment's values in the given postElement.
 */
/*
function setCommentValues(postElement, id, text, author) {
  var comment = postElement.getElementsByClassName('comment-' + id)[0];
  comment.getElementsByClassName('comment')[0].innerText = text;
  comment.getElementsByClassName('fp-username')[0].innerText = author;
}
*/

/**
 * Deletes the comment of the given ID in the given postElement.
 */
/*
function deleteComment(postElement, id) {
  var comment = postElement.getElementsByClassName('comment-' + id)[0];
  comment.parentElement.removeChild(comment);
}
*/

/*
function getJobs() {
  console.log('getJobs()');
  var jobsRef = firebase.database().ref('Jobs');

  var jobPostsSection = document.getElementById('jobPost-row');

  var fetchPosts = function (postsRef, sectionElement) {

    postsRef.on('child_added', function (data) {
      console.log("child added: ");
      console.log(JSON.stringify(data.val(), null, '  '));
*/
      /*
      {
        "department_id": "pet",
        "jobDescription": "My puppies need to be walked every Tuesday at 6 PM",
        "jobName": "Walk 2 Dogs",
        "jobPicture": "https://firebasestorage.googleapis.com/v0/b/laborless-6d04f.appspot.com/o/dogs.jpg?alt=media&token=59606a5b-687f-49b1-82e2-f9583fc105f7",
        "requestedBy": "y0ixAWrVCSbCsKH2rvCcn7dQAeC3",
        "status": "incomplete"
      }
      */
/*
      var jobTitle = data.val().jobName; //$("#job-title").val();
      var jobDesc = data.val().jobDescription; //$("#job-description").val();
      var requestedBy = data.val().requestedBy;
      var status = data.val().status;
      var jobPicture = data.val().jobPicture;
      var department_id = data.val().department_id;

      //Clear out text after posting job
      //$("#job-title").val("");
      //$("#job-description").val("");

      displayJob(jobTitle, jobDesc, requestedBy);
*/
      /*var author = data.val().author || 'Anonymous';
      var containerElement = sectionElement.getElementsByClassName('posts-container')[0];
      containerElement.insertBefore(
        createPostElement(data.key, data.val().title, data.val().body, author, data.val().uid, data.val().authorPic),
        containerElement.firstChild);*/
/*
    });
    postsRef.on('child_changed', function (data) {
      console.log("child changed");
*/
      /*var containerElement = sectionElement.getElementsByClassName('posts-container')[0];
      var postElement = containerElement.getElementsByClassName('post-' + data.key)[0];
      postElement.getElementsByClassName('mdl-card__title-text')[0].innerText = data.val().title;
      postElement.getElementsByClassName('username')[0].innerText = data.val().author;
      postElement.getElementsByClassName('text')[0].innerText = data.val().body;
      postElement.getElementsByClassName('star-count')[0].innerText = data.val().starCount;*/
/*
    });
    postsRef.on('child_removed', function (data) {
      console.log("child removed");
*/
      /*var containerElement = sectionElement.getElementsByClassName('posts-container')[0];
      var post = containerElement.getElementsByClassName('post-' + data.key)[0];
      post.parentElement.removeChild(post);*/
/*
    });

  };

  // Fetching and displaying all posts of each sections.
  console.log("fetching jobs");
  fetchPosts(jobsRef, jobPostsSection);

  // Keep track of all Firebase refs we are listening to.
  listeningFirebaseRefs.push(jobsRef);
}
*/

/**
 * Handles the sign up button press.
 */
/*
function handleSignUp() {
  //TODO: catch username
  console.log("handleSignUp()");

  var email = document.getElementById('email').value;
  var password = document.getElementById('password').value;

  if (email.length < 4) {
    alert('Please enter an email address.');
    return;
  }
  if (password.length < 4) {
    alert('Please enter a password.');
    return;
  }
  // Sign in with email and pass.
  firebase.auth().createUserWithEmailAndPassword(email, password).catch(function (error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // [START_EXCLUDE]
    if (errorCode == 'auth/weak-password') {
      alert('The password is too weak.');
    } else {
      alert(errorMessage);
    }
    console.log(error);
    // [END_EXCLUDE]
  });
}
*/