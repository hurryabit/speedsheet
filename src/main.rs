#![feature(proc_macro_hygiene, decl_macro)]

#[macro_use] extern crate rocket;
#[macro_use] extern crate serde_derive;
extern crate rocket_contrib;

#[cfg(test)] mod tests;

use std::sync::Mutex;
use std::vec::Vec;

use rocket::Request;
use rocket::response::Redirect;
use rocket::response::status::BadRequest;
use rocket::request::Form;
use rocket::State;
use rocket_contrib::serve::StaticFiles;
use rocket_contrib::templates::Template;

mod sheet;
use sheet::*;

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
    CellView { name, value, formula, active: false }
  }
}

#[derive(Clone, Serialize)]
struct RowView {
  row: usize,
  cells: Vec<CellView>,
}

impl RowView {
  fn from_cells(row: usize, cells: &Vec<Cell>) -> Self {
    let cells = cells.iter().enumerate().map(|(col, cell)| CellView::from_cell(&Coord { row, col }, cell)).collect();
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
    let cols = (b'A'..).take(sheet.num_cols).map(|col| char::from(col).to_string()).collect();
    let rows = sheet.cells.iter().enumerate().map(|(row, cells)| RowView::from_cells(row, cells)).collect();
    SheetView { cols, rows }
  }
}

#[derive(Serialize)]
struct View {
  sheet_view: SheetView,
}

type AppState<'r> = State<'r, Mutex<Sheet>>;

#[get("/")]
fn index(app_state: AppState) -> Template {
  let sheet = &app_state.lock().unwrap();
  let sheet_view = SheetView::from_sheet(sheet);
  let view = View { sheet_view };
  Template::render("index", &view)
}

#[derive(FromForm)]
struct Update {
  coord: String,
  formula: String,
}

#[post("/update", data="<form>")]
fn update(app_state: AppState, form: Form<Update>) -> Result<Redirect, BadRequest<String>> {
  let coord = form.coord.parse::<Coord>().map_err(|e| BadRequest(Some(e.to_string())))?;
  let expr = form.formula.parse::<Expr>().map_err(|e| BadRequest(Some(e.to_string())))?;
  let sheet = &mut app_state.lock().unwrap();
  sheet.set(&coord, expr);
  Ok(Redirect::to("/"))
}

fn rocket() -> rocket::Rocket {
  let sheet = Sheet::new(10, 6);
  let app_state = Mutex::new(sheet);
    rocket::ignite()
      .mount("/", routes![index, update])
      .mount("/static", StaticFiles::from("static"))
      .attach(Template::fairing())
      .manage(app_state)
}

fn main() {
    rocket().launch();
}
