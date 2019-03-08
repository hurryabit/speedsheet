pub trait ToTS {
  type TS;

  fn to_ts(self) -> Self::TS;
}

#[derive(Serialize)]
#[serde(tag = "kind")]
pub enum Result<T, E> {
  Ok { ok: T },
  Err { err : E },
}

impl<T, E> ToTS for std::result::Result<T, E> {
  type TS = Result<T, E>;

  fn to_ts(self) -> Self::TS {
    match self {
      std::result::Result::Ok(ok) => Result::Ok { ok },
      std::result::Result::Err(err) => Result::Err { err },
    }
  }
}
