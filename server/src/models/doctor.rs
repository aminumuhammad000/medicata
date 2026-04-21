use serde::Deserialize;

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub struct DoctorSearchQuery {
    pub specialty: Option<String>,
    pub min_rating: Option<f32>,
    #[allow(dead_code)]
    pub available_date: Option<chrono::NaiveDate>,
}
