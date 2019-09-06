#![deny(clippy::all)]
#![deny(warnings)]
#![allow(ellipsis_inclusive_range_patterns)]
#![feature(proc_macro_hygiene, decl_macro)]

#[macro_use]
extern crate rocket;
#[macro_use]
extern crate serde_derive;
extern crate rocket_contrib;

#[cfg(test)]
mod tests;

use std::sync::Mutex;
use std::vec::Vec;

use rocket::response::Redirect;
use rocket::State;

use rocket_contrib::json::Json;
use rocket_contrib::serve::StaticFiles;
use rocket_contrib::templates::Template;

mod sheet;
use sheet::*;

mod ts;
use ts::ToTS;

#[derive(Clone, Serialize)]
struct CellView {
    name: String,
    value: i64,
    formula: String,
    active: bool,
}

impl CellView {
    fn from_cell(coord: &Coord, cell: &Cell) -> Self {
        let name = coord.to_string();
        let value = cell.value;
        let formula = cell.expr.to_string();
        CellView {
            name,
            value,
            formula,
            active: false,
        }
    }
}

#[derive(Clone, Serialize)]
struct RowView {
    row: usize,
    cells: Vec<CellView>,
}

impl RowView {
    fn from_cells(row: usize, cells: &[Cell]) -> Self {
        let cells = cells
            .iter()
            .enumerate()
            .map(|(col, cell)| CellView::from_cell(&Coord { row, col }, cell))
            .collect();
        let row = row + 1;
        RowView { row, cells }
    }
}

#[derive(Clone, Serialize)]
struct SheetView {
    cols: Vec<String>,
    rows: Vec<RowView>,
}

impl SheetView {
    fn from_sheet(sheet: &Sheet) -> Self {
        let cols = (b'A'..)
            .take(sheet.num_cols)
            .map(|col| char::from(col).to_string())
            .collect();
        let rows = sheet
            .cells
            .iter()
            .enumerate()
            .map(|(row, cells)| RowView::from_cells(row, cells))
            .collect();
        SheetView { cols, rows }
    }
}

#[derive(Serialize)]
struct AppView {
    sheet_view: SheetView,
}

type AppState<'r> = State<'r, Mutex<Sheet>>;

#[get("/")]
fn index() -> Redirect {
    Redirect::to(uri!(view))
}

#[get("/view")]
fn view(app_state: AppState) -> Template {
    let sheet = &app_state.lock().unwrap();
    let sheet_view = SheetView::from_sheet(sheet);
    let app_view = AppView { sheet_view };
    Template::render("index", &app_view)
}

#[derive(Deserialize)]
struct UpdateParams {
    coord: String,
    formula: String,
}

#[post("/update", data = "<params>")]
fn update(app_state: AppState, params: Json<UpdateParams>) -> Json<ts::Result<Log, String>> {
    Json(update_rs(app_state, params).to_ts())
}

fn update_rs(app_state: AppState, form: Json<UpdateParams>) -> Result<Log, String> {
    let coord = form.coord.parse::<Coord>().map_err(|e| e.to_string())?;
    let expr = form.formula.parse::<Expr>().map_err(|e| e.to_string())?;
    let sheet = &mut app_state.lock().unwrap();
    let log = sheet.set(&coord, expr)?;
    Ok(log)
}

fn rocket() -> rocket::Rocket {
    let sheet = Sheet::new(10, 6);
    let app_state = Mutex::new(sheet);
    rocket::ignite()
        .mount("/", routes![index, view, update])
        .mount("/static", StaticFiles::from("static"))
        .attach(Template::fairing())
        .manage(app_state)
}

fn main() {
    rocket().launch();
}
