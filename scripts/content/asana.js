/*jslint indent: 2 */
/*global document: false, chrome: false, $: false, createLink: false, createProjectSelect: false*/

(function () {
  "use strict";
  var iframeRegex = /oauth2relay/, userData = null,
    projectSelect = null;

  function createTimerLink(task) {
    var link = createLink('toggl-button asana');
    link.addEventListener("click", function (e) {
      var projectId = projectSelect.value;

      if (projectId == "default") { return; }

      // Get project to find billable attribute.
      var project = userData.$projectMap[projectId];

      var togglTask;
      {
        // If one of the Asana tags matches a Toggl task, use it.
        var tagList = document.querySelectorAll(".property.tags .token_name");
        for (var i = 0, end = tagList.length; i < end; ++i) {
          togglTask = project.$taskNameMap[tagList[i].text];
          if (togglTask) { break; }
        }

        if (!togglTask) {
          // If the task description prefix matches a Toggl task, use it.
          var taskElem = $("#details_pane_title_row textarea#details_property_sheet_title");
          var taskDescription = taskElem ? taskElem.value : '';

          for (var taskName in project.$taskNameMap) {
            if (taskDescription.substr(0, taskName.length) == taskName) {
              togglTask = project.$taskNameMap[taskName];
              break;
            }
          }
        }
      }

      chrome.extension.sendMessage({
        type: 'timeEntry',
        billable: project ? project.billable : false,
        description: task,
        projectId: projectId,
        taskId: togglTask ? togglTask.id : null
      });
      link.innerHTML = "Started";
      return false;
    });
    return link;
  }

  function addButton() {
    if ($(".toggl-select")) { return; }

    var taskDescription = $(".property.description"),
      titleElement = $("#details_pane_title_row textarea#details_property_sheet_title"),
      asanaProject = $(".ancestor-projects > .tag, .property.projects .token_name");

    if (!(taskDescription && titleElement && asanaProject)) { return; }

    projectSelect = createProjectSelect(userData, "toggl-select asana", asanaProject ? asanaProject.text : '');

    taskDescription.parentNode.insertBefore(createTimerLink(titleElement.value), taskDescription.nextSibling);
    taskDescription.parentNode.insertBefore(projectSelect, taskDescription.nextSibling);
  }

  chrome.extension.sendMessage({type: 'activate'}, function (response) {
    if (response.success) {
      //console.log(response.user);
      userData = response.user;
      document.addEventListener('webkitAnimationStart', function (event) {
        if (event.animationName == 'nodeInserted') { addButton(); }
      }, true);
    }
  });

}());

// vim: shiftwidth=2 tabstop=2 expandtab:
