let logArea: HTMLTextAreaElement;
let formulaInput: HTMLInputElement;
let formulaFieldSet: HTMLFieldSetElement;
let formulaForm: HTMLFormElement;
let selectedCell: HTMLTableCellElement;

// Handler for clicking on cells.
function onSelectCell(event: Event) {
    const previousCell = selectedCell;
    selectedCell = event.target as HTMLTableCellElement;

    previousCell.classList.remove("table-primary");
    selectedCell.classList.add("table-primary");
    selectedCell.focus();

    formulaInput.value = selectedCell.dataset.formula!;
    formulaFieldSet.disabled = true;
}

function onEditCell(event: Event) {
    onSelectCell(event);
    formulaFieldSet.disabled = false;
    formulaInput.focus();
    formulaInput.select();
}

function onKeypressCell(event: KeyboardEvent) {
    if (event.key === "Enter") {
        onEditCell(event);
    }
}

function onKeydownCell(event: KeyboardEvent) {
    const oldCoord: string = (event.target as Element).id;
    let newCoord: string;

    switch (event.key) {
        case "ArrowLeft": {
          newCoord = String.fromCharCode(oldCoord.charCodeAt(0) - 1) + oldCoord.substring(1);
          break;
        }
        case "ArrowUp": {
          const row = parseInt(oldCoord.substring(1), 10);
          newCoord = oldCoord.charAt(0) + (row - 1).toString();
          break;
        }
        case "ArrowRight": {
          newCoord = String.fromCharCode(oldCoord.charCodeAt(0) + 1) + oldCoord.substring(1);
          break;
        }
        case "ArrowDown": {
          const row = parseInt(oldCoord.substring(1), 10);
          newCoord = oldCoord.charAt(0) + (row + 1).toString();
          break;
        }
        default:
            return;
    }

    $("#" + newCoord).click();
}

function log(msg: string) {
    logArea.value += "\n" + msg;
    logArea.scrollTop = logArea.scrollHeight;
}

function clearLog() {
    logArea.value = "Computation log:";
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize);
}
else {
  initialize();
}

function initialize() {
    const sheetTable: HTMLTableElement = document.querySelector("#sheet") as HTMLTableElement;
    selectedCell = document.querySelector("#A1") as HTMLTableCellElement;

    logArea = document.querySelector("#log") as HTMLTextAreaElement;
    const clearButton: Element = document.querySelector("#clear")!;

    formulaInput = document.querySelector("#formula") as HTMLInputElement;
    formulaFieldSet = document.querySelector("#formula_fieldset") as HTMLFieldSetElement;
    formulaForm = document.querySelector("#formula_form") as HTMLFormElement;

    // Set up log widget.
    $(logArea).outerHeight($(sheetTable).outerHeight()!);
    clearLog();
    clearButton.addEventListener("click", () => clearLog());

    // Install handler for clicking on table cells.
    document.querySelectorAll("td").forEach((cell) => {
        cell.tabIndex = -1;
        cell.addEventListener("click", onSelectCell);
        cell.addEventListener("dblclick", onEditCell);
        cell.addEventListener("keypress", onKeypressCell);
        cell.addEventListener("keydown", onKeydownCell);
    });

    formulaInput.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key === "Escape") {
            event.preventDefault();
            selectedCell.click();
        }
    });

    selectedCell.click();

    formulaForm.addEventListener("submit", (event) => {
        event.preventDefault();
        $.ajax({
            data: {
                coord: selectedCell.id,
                formula: formulaInput.value
            },
            dataType: "json",
            method: "post",
            url: "update",
        })
        .done((data: Result<Log, string>) => {
          switch (data.kind) {
              case "Ok": {
                  log("> " + selectedCell.id + " = " + formulaInput.value);
                  for (const entry of data.ok) {
                      // TODO: Raise an error if the cell does not exist.
                      (document.querySelector("#" + entry.coord) as HTMLTableCellElement).textContent = entry.to.toString();
                      log(entry.coord + " = " + entry.to);
                  }
                  selectedCell.dataset.formula = formulaInput.value;
                  selectedCell.click();
                  break;
              }
              case "Err": {
                  alert(data.err);
                  break;
              }
              default: impossible(data);
          }
        })
        .fail((xhr, status, error) => { alert("Connection to server failed: " + error); });
    });
}

class Ok<T> {
    public kind: "Ok" = "Ok";
    public ok: T;
    constructor(ok: T) {
        this.ok = ok;
    }
}

interface LogEntry {
  coord: string;
  from: number;
  to: number;
}

type Log = Array<LogEntry>;

class Err<E> {
    public kind: "Err" = "Err";
    public err: E;
    constructor(err: E) {
        this.err = err;
    }
}

type Result <T, E> = Ok<T> | Err<E>;

function impossible(x: never): never {
    return x;
}
