"use strict";
var Key;
(function (Key) {
    Key[Key["ENTER"] = 13] = "ENTER";
    Key[Key["ESCAPE"] = 27] = "ESCAPE";
    Key[Key["LEFT"] = 37] = "LEFT";
    Key[Key["UP"] = 38] = "UP";
    Key[Key["RIGHT"] = 39] = "RIGHT";
    Key[Key["DOWN"] = 40] = "DOWN";
})(Key || (Key = {}));
// Handler for clicking on cells.
function onSelectCell(event) {
    var newCell = $(event.target);
    var newCoord = newCell.prop("id");
    // Get old coordinate and set new coordinate.
    var oldCoord = $("#coord").val();
    $("#coord").val(newCoord);
    // Adjust highlighted cell.
    if (oldCoord !== "") {
        $("#" + oldCoord).removeClass("table-primary");
    }
    newCell.addClass("table-primary");
    newCell.focus();
    // Copy cell value into input field.
    $("#formula").val(newCell.attr("data-formula"));
    $("#formula_fieldset").prop("disabled", true);
}
function onEditCell(event) {
    onSelectCell(event);
    $("#formula_fieldset").prop("disabled", false);
    $("#formula").focus();
    $("#formula").select();
}
function onKeypressCell(event) {
    if (event.which === Key.ENTER) {
        $(event.target).dblclick();
    }
}
function onKeydownCell(event) {
    var oldCoord = event.target.id;
    var newCoord;
    switch (event.which) {
        case Key.LEFT: {
            newCoord = String.fromCharCode(oldCoord.charCodeAt(0) - 1) + oldCoord.substring(1);
            break;
        }
        case Key.UP: {
            var row = parseInt(oldCoord.substring(1), 10);
            newCoord = oldCoord.charAt(0) + (row - 1).toString();
            break;
        }
        case Key.RIGHT: {
            newCoord = String.fromCharCode(oldCoord.charCodeAt(0) + 1) + oldCoord.substring(1);
            break;
        }
        case Key.DOWN: {
            var row = parseInt(oldCoord.substring(1), 10);
            newCoord = oldCoord.charAt(0) + (row + 1).toString();
            break;
        }
        default:
            return;
    }
    $("#" + newCoord).click();
}
// Do this when everthing is loaded.
$(document).ready(function () {
    // Make log window as big as table.
    $("#log").outerHeight($("#sheet").outerHeight());
    // Install handler for clicking on table cells.
    $("td").each(function (_, cell) {
        $(cell).prop("tabindex", -1);
        $(cell).on("click", onSelectCell);
        $(cell).on("dblclick", onEditCell);
        $(cell).on("keypress", onKeypressCell);
        $(cell).on("keydown", onKeydownCell);
    });
    $("#formula").on("keypress", function (event) {
        if (event.which === Key.ESCAPE) {
            var coord = $("#coord").val();
            $("#" + coord).click();
            event.preventDefault();
        }
    });
    var initCoord = $("#coord").val();
    $("#" + initCoord).click();
    $("#check").click(function () {
        $("#formula").focus();
        $.ajax({
            data: $("#formula_form").serializeArray(),
            dataType: "json",
            url: "check"
        })
            .done(function (data) {
            switch (data.kind) {
                case "Ok": {
                    alert("all good");
                    break;
                }
                case "Err": {
                    alert(data.err);
                    break;
                }
                default: impossible(data);
            }
        })
            .fail(function (xhr, status, error) { alert("Connection to server failed: " + error); });
    });
    // $("#formula_form").on("submit", function(event) {
    //   event.preventDefault();
    //   var coord = $("#coord").val();
    //   $("#" + coord).text($("#formula").val());
    // });
});
var Ok = /** @class */ (function () {
    function Ok(ok) {
        this.kind = "Ok";
        this.ok = ok;
    }
    return Ok;
}());
var Err = /** @class */ (function () {
    function Err(err) {
        this.kind = "Err";
        this.err = err;
    }
    return Err;
}());
function impossible(x) {
    return x;
}
