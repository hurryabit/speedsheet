extern crate peg;

fn main() {
  peg::cargo_build("src/expr_parser.rustpeg");
}
