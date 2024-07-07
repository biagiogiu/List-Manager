const itemAreas = document.querySelectorAll(".item-container")
itemAreas.forEach(dragArea =>
    new Sortable(dragArea, {
        draggable: ".list-item.active-item",
        group: 'item-container',
        animation: 350
    })
)
const listArea = document.querySelector(".list-container")
new Sortable(listArea, {
    animation: 350
})

$(document).ready(reorderLists());

function reorderLists() {
    // Sort the outer .list elements by their data-index attribute
    $(".list").sort(function(a, b) {
        return $(a).data("index") - $(b).data("index");
    }).appendTo(".list-container");
    reorderItems();
}

function reorderItems() {
    // Step 1: For each .list element, sort its .list-item children by their data-index attribute
    $(".list").each(function() {
        var $list = $(this);
        var $activeItems = $list.find(".list-item.active-item");
        var $itemContainer = $list.find(".item-container")
        // Sort the .list-item elements by their data-index attribute
        $activeItems.sort(function(a, b) {
            return $(a).data("index") - $(b).data("index");
        });
        var $deactivatedItems = $list.find(".list-item.deactivated-item");

        $deactivatedItems.sort(function(a, b) {
            return $(a).data("index") - $(b).data("index");
        });

        // Step 2: Append the sorted .list-item elements back to the .list container
        $activeItems.appendTo($itemContainer);
        $deactivatedItems.appendTo($itemContainer);
    });
}

function updateSorting() {
    var lists = $(".list-container").prop('outerHTML')

    $.ajax({
        type: "POST",
        url: "/update_sorting",
        contentType: 'application/json',
        data: JSON.stringify({ 'lists': lists }),
        dataType: 'json',
        success: function(result) {
            console.log(result);
        }
    });
}

function addItem(button) {
    // Create a new li element
    var newItem = document.createElement("li");
    newItem.className = "list-item"
    // Get the ul belonging to the clicked button
    itemList = button.parentNode.nextElementSibling;
    // Insert the new li element at the top of the list
    itemList.insertBefore(newItem, itemList.firstChild);
    // Create a new span
    var newSpan = document.createElement('span');
    newSpan.className = "item-name"
    newSpan.setAttribute("contenteditable", "true");
    // Set a placeholder text
    newSpan.textContent = "New To Do";

    // Create edit button with SVG
    var editButton = document.createElement('button');
    editButton.className = 'edit-item-button';
    editButton.setAttribute('onclick', 'editItem(this)');
    var editTooltip = document.createElement('span')
    editTooltip.className = ('tooltip')
    editTooltip.textContent = 'Edit'
    var editSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    editSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    editSvg.setAttribute('width', '16');
    editSvg.setAttribute('height', '16');
    editSvg.setAttribute('fill', 'currentColor');
    editSvg.setAttribute('class', 'bi bi-pencil');
    editSvg.setAttribute('viewBox', '0 0 16 16');
    var editPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    editPath.setAttribute('d', 'M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325');

    editSvg.appendChild(editPath);
    editButton.appendChild(editTooltip)
    editButton.appendChild(editSvg);

    // Create change status button
    var statusButton = document.createElement('button');
    statusButton.className = 'item-checkbox-wrapper';
    statusButton.setAttribute('onclick', 'changeItemStatus(this)');
    var editTooltip = document.createElement('span')
    editTooltip.className = ('tooltip')
    editTooltip.textContent = 'Done'

    var statusLabel = document.createElement('label')
    var statusInput = document.createElement('input')
    statusInput.setAttribute('type', 'checkbox')
    statusInput.setAttribute('name', 'status-checkbox')
    var statusSpan = document.createElement('span')
    statusSpan.className = 'checkbox'
    statusLabel.appendChild(statusInput)
    statusLabel.appendChild(statusSpan)

    statusButton.appendChild(editTooltip)
    statusButton.appendChild(statusLabel);


    // Create delete button with SVG
    var deleteButton = document.createElement('button');
    deleteButton.className = 'delete-item-button';
    deleteButton.setAttribute('onclick', 'deleteItem(this)');
    var deleteTooltip = document.createElement('span')
    deleteTooltip.className = ('tooltip')
    deleteTooltip.textContent = 'Delete To Do'
    var deleteSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    deleteSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    deleteSvg.setAttribute('width', '16');
    deleteSvg.setAttribute('height', '16');
    deleteSvg.setAttribute('fill', 'currentColor');
    deleteSvg.setAttribute('class', 'bi bi-trash3');
    deleteSvg.setAttribute('viewBox', '0 0 16 16');

    var deletePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    deletePath.setAttribute('d', 'M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5');

    deleteSvg.appendChild(deletePath);
    deleteButton.appendChild(deleteTooltip)
    deleteButton.appendChild(deleteSvg);

    // Append span to li
    newItem.appendChild(newSpan);

    // Focus on the new li element so the user can start typing
    newSpan.focus();
    // Optional: Select all the text inside the new li element for easier replacement
    document.execCommand('selectAll', false, null);

    // Remove the placeholder text when the user starts typing
    newSpan.addEventListener('focus', function() {
        if (newSpan.textContent === "New To Do") {
            newSpan.textContent = "";
        }
    });

    // Make the li element uneditable and handle empty text on blur
    newSpan.addEventListener('blur', function() {
        if (newSpan.textContent.trim() === "") {
            newItem.remove();
        } else {
            newSpan.removeAttribute("contenteditable");
            var listWithNewItem = $(newItem.closest(".list")).prop('outerHTML')
            $.ajax({
                type: "POST",
                url: "/add_item",
                contentType: "application/json",
                data: JSON.stringify({ 'list': listWithNewItem }),
                success: function(response) {
                    newItem.setAttribute("id", response.id);
                    // Add buttons to li
                    newItem.appendChild(editButton);
                    newItem.appendChild(statusButton);
                    newItem.appendChild(deleteButton);
                },
                error: function() {
                    alert("An error occurred while saving the item.");
                }
            });
        }
    });

    newSpan.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            newSpan.blur()
        }
    });
}

function editItem(button) {
    // select the item to edit
    var listItem = button.closest(".list-item");
    var editItem = listItem.querySelector("span")
    // make the span editable again
    editItem.setAttribute("contenteditable", "true");
//    editItem.textContent = "New To Do";
    editItem.focus();
    document.execCommand('selectAll', false, null);

    // Remove the placeholder text when the user starts typing
    editItem.addEventListener('focus', function() {
        if (editItem.textContent === "New To Do") {
            editItem.textContent = "";
        }
    });

    // Make the span element uneditable and handle empty text on blur
    editItem.addEventListener('blur', function() {
        if (editItem.textContent.trim() === "") {
            editItem.textContent = "New To Do";
        }
        editItem.removeAttribute("contenteditable");
        $.ajax({
            type: "POST",
            url: "/edit_item",
            contentType: "application/json",
            data: JSON.stringify({ 'edit_item': $(listItem).prop('outerHTML') }),
            success: function(response) {
                console.log("item edited");
            },
            error: function() {
                alert("An error occurred while saving the To Do.");
            }
        });
    });

    editItem.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            editItem.blur()
        }
    });
}

function editItemName(spanName) {
    var listItem = button.closest(".list-item");
    // make the span editable again
    spanName.setAttribute("contenteditable", "true");
//    editItem.textContent = "New To Do";
    spanName.focus();
    document.execCommand('selectAll', false, null);

    // Remove the placeholder text when the user starts typing
    spanName.addEventListener('focus', function() {
        if (spanName.textContent === "New To Do") {
            spanName.textContent = "";
        }
    });

    // Make the span element uneditable and handle empty text on blur
    spanName.addEventListener('blur', function() {
        if (spanName.textContent.trim() === "") {
            spanName.textContent = "New To Do";
        }
        spanName.removeAttribute("contenteditable");
        $.ajax({
            type: "POST",
            url: "/edit_item",
            contentType: "application/json",
            data: JSON.stringify({ 'edit_item': $(listItem).prop('outerHTML') }),
            success: function(response) {
                console.log(response.response);
            },
            error: function() {
                alert("An error occurred while saving the To Do.");
            }
        });
    });

    editItem.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            editItem.blur()
        }
    });
}

function changeItemStatus(button) {
    var listItem = button.closest(".list-item");
    var inputStatus = listItem.querySelector('input').checked
    // if item not checked, mark it as checked and deactivate it
    $.ajax({
        type: "POST",
        url: "/change_item_status",
        contentType: "application/json",
        data: JSON.stringify({ 'item': $(listItem).prop('outerHTML') }),
        success: function(response) {
            reorderItems();
            console.log(response.response);
        },
        error: function() {
            alert("An error occurred while changing the status");
        }
    });
}

function deleteItem(button) {
    var listItem = button.closest(".list-item");
    $.ajax({
        type: "POST",
        url: "/delete_item",
        contentType: "application/json",
        data: JSON.stringify({ 'delete_item': $(listItem).prop('outerHTML') }),
        success: function(response) {
            listItem.remove();
            console.log(response.response);
        },
        error: function() {
            alert("An error occurred while deleting the To Do");
        }
    });
}

function deleteList(button) {
    var list = button.closest(".list");
    $.ajax({
        type: "POST",
        url: "/delete_list",
        contentType: "application/json",
        data: JSON.stringify({ 'delete_list': $(list).prop('outerHTML') }),
        success: function(response) {
            list.remove();
            console.log(response.response);
        },
        error: function() {
            alert("An error occurred while deleting the List");
        }
    });
}

function addList() {
    var newList = document.createElement('li');
    newList.className = 'list';
    newList.setAttribute('data-index', '0');
    newList.setAttribute('ondragend','updateSorting()');

    var listHeader = document.createElement('div');
    listHeader.className = 'list-header'

    var listName = document.createElement('div');
    listName.className = 'list-name'

    var listLabel = document.createElement('label');
    listLabel.className = 'list-label'
    listLabel.setAttribute('for', 'temp');

    var newSpan = document.createElement('span')
    newSpan.setAttribute("contenteditable", "true")
    newSpan.textContent = "New List";

    var listCheckbox = document.createElement('input')
    listCheckbox.className = 'list-checkbox'
    listCheckbox.setAttribute("type", "checkbox")
    listCheckbox.setAttribute("id", "temp")
    listCheckbox.checked = true

    listLabel.appendChild(newSpan)
    listName.appendChild(listLabel)
    listName.appendChild(listCheckbox)

    // Create add item button with SVG
    var addButton = document.createElement('button');
    addButton.className = 'add-item-button';
    addButton.setAttribute('onclick', 'addItem(this)');
    var addButtonTooltip = document.createElement('span')
    addButtonTooltip.className = ('tooltip')
    addButtonTooltip.textContent = 'Add To Do'
    var addButtonSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    addButtonSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    addButtonSvg.setAttribute('width', '16');
    addButtonSvg.setAttribute('height', '16');
    addButtonSvg.setAttribute('fill', 'currentColor');
    addButtonSvg.setAttribute('class', 'bi bi-trash3');
    addButtonSvg.setAttribute('viewBox', '0 0 16 16');

    var addPath1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    addPath1.setAttribute('d', 'M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16');
    var addPath2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    addPath2.setAttribute('d', 'M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4');

    addButtonSvg.appendChild(addPath1);
    addButtonSvg.appendChild(addPath2);
    addButton.appendChild(addButtonTooltip)
    addButton.appendChild(addButtonSvg);

    // Create edit list button with SVG
    var editButton = document.createElement('button');
    editButton.className = 'edit-list-button';
    editButton.setAttribute('onclick', 'editList(this)');
    var editButtonTooltip = document.createElement('span')
    editButtonTooltip.className = ('tooltip')
    editButtonTooltip.textContent = 'Edit List'
    var editButtonSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    editButtonSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    editButtonSvg.setAttribute('width', '16');
    editButtonSvg.setAttribute('height', '16');
    editButtonSvg.setAttribute('fill', 'currentColor');
    editButtonSvg.setAttribute('class', 'bi bi-trash3');
    editButtonSvg.setAttribute('viewBox', '0 0 16 16');

    var addPath1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    addPath1.setAttribute('d', 'M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325');

    editButtonSvg.appendChild(addPath1);
    editButton.appendChild(editButtonTooltip)
    editButton.appendChild(editButtonSvg);

    // Create delete button with SVG
    var deleteButton = document.createElement('button');
    deleteButton.className = 'delete-item-button';
    deleteButton.setAttribute('onclick', 'deleteList(this)');
    var deleteTooltip = document.createElement('span')
    deleteTooltip.className = ('tooltip')
    deleteTooltip.textContent = 'Delete List'
    var deleteSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    deleteSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    deleteSvg.setAttribute('width', '16');
    deleteSvg.setAttribute('height', '16');
    deleteSvg.setAttribute('fill', 'currentColor');
    deleteSvg.setAttribute('class', 'bi bi-trash3');
    deleteSvg.setAttribute('viewBox', '0 0 16 16');

    var deletePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    deletePath.setAttribute('d', 'M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5');

    deleteSvg.appendChild(deletePath);
    deleteButton.appendChild(deleteTooltip)
    deleteButton.appendChild(deleteSvg);

    listHeader.appendChild(listName)
    listHeader.appendChild(addButton)
    listHeader.appendChild(editButton)
    listHeader.appendChild(deleteButton)

    var itemContainer = document.createElement('li')
    itemContainer.className = 'item-container'
    new Sortable(itemContainer, {
        group: 'item-container',
        animation: 350
    })

    newList.appendChild(listHeader)
    newList.appendChild(itemContainer)

    listContainer = document.querySelector(".list-container")
    listContainer.insertBefore(newList, listContainer.firstChild)

    newSpan.focus();
    // Optional: Select all the text inside the new li element for easier replacement
    document.execCommand('selectAll', false, null);

    // Remove the placeholder text when the user starts typing
    newSpan.addEventListener('focus', function() {
        if (newSpan.textContent === "New List") {
            newSpan.textContent = "";
        }
    });

    // Make the li element uneditable and handle empty text on blur
    newSpan.addEventListener('blur', function() {
        if (newSpan.textContent.trim() === "") {
            newList.remove();
        } else {
            newSpan.removeAttribute("contenteditable");
            $.ajax({
                type: "POST",
                url: "/add_list",
                contentType: "application/json",
                data: JSON.stringify({ 'new_list': $(newList).prop('outerHTML') }),
                success: function(response) {
                    listLabel.setAttribute('for', response.id);
                    listCheckbox.setAttribute("id", response.id);
                },
                error: function() {
                    alert("An error occurred while saving the item.");
                }
            });
        }
    });
    newSpan.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            newSpan.blur()
        }
    });
}

function editList(button) {
    var list = button.closest(".list");
    var listName = list.querySelector(".list-label span")
    // make the span editable again
    listName.setAttribute("contenteditable", "true");
    listName.focus();
    document.execCommand('selectAll', false, null);

    // Make the span element uneditable and handle empty text on blur
    listName.addEventListener('blur', function() {
        if (listName.textContent.trim() === "") {
            listName.textContent = "New List";
        }
        listName.removeAttribute("contenteditable");
        $.ajax({
            type: "POST",
            url: "/edit_list",
            contentType: "application/json",
            data: JSON.stringify({ 'list': $(list).prop('outerHTML') }),
            success: function(response) {
                console.log(response.response);
            },
            error: function() {
                alert("An error occurred while editing the List.");
            }
        });
    });

    listName.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            listName.blur()
        }
    });
}