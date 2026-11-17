//! Local copies of the small napi boundary utilities the orchard crate used
//! to import from the base crate (BigIntString/TryToU64, WithJsError,
//! DynamicValue) plus the String/u64 -> domain enum parsers. Behavior-identical
//! ports: same error statuses, same error texts, same JS class surface.

use std::collections::BTreeMap;

use dpp::{
    ProtocolError,
    dashcore::Network,
    data_contract::associated_token::token_distribution_key::TokenDistributionType,
    version::{
        PlatformVersion, v1::PLATFORM_V1, v2::PLATFORM_V2, v3::PLATFORM_V3, v4::PLATFORM_V4,
        v5::PLATFORM_V5, v6::PLATFORM_V6, v7::PLATFORM_V7, v8::PLATFORM_V8, v9::PLATFORM_V9,
        v10::PLATFORM_V10, v11::PLATFORM_V11, v12::PLATFORM_V12, v13::PLATFORM_V13,
        v14::PLATFORM_V14,
    },
    withdrawal::Pooling,
};
use napi::{
    Status,
    bindgen_prelude::{Either16, Null, Uint8Array, Undefined},
};
use napi_derive::napi;

pub trait TryToU64 {
    fn try_to_u64(&self) -> Result<u64, napi::Error>;
    fn try_from_string(val: String) -> Result<BigIntString, napi::Error>;
    fn from_u64(val: u64) -> BigIntString;
    fn from_i64(val: i64) -> BigIntString;
}

#[napi]
pub type BigIntString = String;

impl TryToU64 for BigIntString {
    fn try_to_u64(&self) -> Result<u64, napi::Error> {
        self.parse().map_err(|_| {
            napi::Error::new(
                Status::Unknown,
                format!(
                    "Cannot convert String from Uint64String to u64 ({:?})",
                    self.clone()
                ),
            )
        })
    }

    fn try_from_string(val: String) -> Result<Self, napi::Error> {
        match val.trim().parse::<u64>() {
            Ok(num) => Ok(num.to_string()),
            Err(_) => Err(napi::Error::new(
                napi::Status::NumberExpected,
                format!("Cannot parse string ({}) to u64", val),
            )),
        }
    }

    fn from_u64(val: u64) -> Self {
        val.to_string()
    }

    fn from_i64(val: i64) -> Self {
        val.to_string()
    }
}

pub trait WithJsError<T> {
    fn with_js_error(self) -> Result<T, napi::Error>;
}

impl<T> WithJsError<T> for Result<T, napi::Error> {
    fn with_js_error(self) -> Result<T, napi::Error> {
        match self {
            Ok(ok) => Ok(ok),
            Err(error) => Err(error),
        }
    }
}

impl<T> WithJsError<T> for Result<T, ProtocolError> {
    fn with_js_error(self) -> Result<T, napi::Error> {
        match self {
            Ok(ok) => Ok(ok),
            Err(error) => Err(napi::Error::new(Status::GenericFailure, error.to_string())),
        }
    }
}

/// A dynamically-typed JS value crossing the napi boundary. Ported from the
/// base crate's `dynamic_value::DynamicValue` with the identical JS surface
/// (same `js_name`, constructor conversion order and getters) so orchard
/// method signatures keep accepting the very same arguments.
#[derive(Clone)]
#[napi(js_name = "DynamicValue")]
pub struct DynamicValue(
    Either16<
        String,
        Vec<u8>,
        u8,
        u16,
        u32,
        BigIntString,
        bool,
        BTreeMap<String, DynamicValue>,
        Vec<DynamicValue>,
        Null,
        Undefined,
        i8,
        i16,
        i32,
        i64,
        f64,
    >,
);

#[napi]
impl DynamicValue {
    #[napi(constructor)]
    pub fn new(
        value: Either16<
            String,
            Uint8Array,
            f64,
            u16,
            u32,
            BigIntString,
            bool,
            Vec<&DynamicValue>,
            BTreeMap<String, &DynamicValue>,
            Null,
            Undefined,
            i8,
            i16,
            i32,
            i64,
            u8,
        >,
    ) -> Self {
        // f64 go first, else number will be automatically converted to integer
        // arr go first also
        let owned = match value {
            Either16::A(v) => Either16::A(v),
            Either16::B(v) => Either16::B(v.to_vec()),
            Either16::C(v) => Either16::P(v),
            Either16::D(v) => Either16::D(v),
            Either16::E(v) => Either16::E(v),
            Either16::F(v) => Either16::F(v),
            Either16::G(v) => Either16::G(v),
            Either16::H(vec) => Either16::I(vec.into_iter().cloned().collect()),
            Either16::I(map) => Either16::H(map.into_iter().map(|(k, v)| (k, v.clone())).collect()),
            Either16::J(v) => Either16::J(v),
            Either16::K(v) => Either16::K(v),
            Either16::L(v) => Either16::L(v),
            Either16::M(v) => Either16::M(v),
            Either16::N(v) => Either16::N(v),
            Either16::O(v) => Either16::O(v),
            Either16::P(v) => Either16::C(v),
        };

        Self(owned)
    }

    #[napi(js_name = "fromBigIntString")]
    pub fn from_big_int_string(value: String) -> Self {
        Self(Either16::F(value))
    }

    #[napi(js_name = "fromInt")]
    pub fn from_int(value: i64) -> Self {
        Self(Either16::O(value))
    }

    #[napi(js_name = "fromUInt")]
    pub fn from_unsigned_int(value: u32) -> Self {
        Self(Either16::E(value))
    }

    #[napi(js_name = "fromFloat")]
    pub fn from_float(value: f64) -> Self {
        Self(Either16::P(value))
    }

    #[napi(getter, js_name = "value")]
    pub fn value(
        &self,
    ) -> Either16<
        String,
        Uint8Array,
        u8,
        u16,
        u32,
        BigIntString,
        bool,
        BTreeMap<String, DynamicValue>,
        Vec<DynamicValue>,
        Null,
        Undefined,
        i8,
        i16,
        i32,
        i64,
        f64,
    > {
        match self.0.clone() {
            Either16::A(v) => Either16::A(v),
            Either16::B(v) => Either16::B(v.into()),
            Either16::C(v) => Either16::C(v),
            Either16::D(v) => Either16::D(v),
            Either16::E(v) => Either16::E(v),
            Either16::F(v) => Either16::F(v),
            Either16::G(v) => Either16::G(v),
            Either16::H(map) => Either16::H(map),
            Either16::I(vec) => Either16::I(vec),
            Either16::J(v) => Either16::J(v),
            Either16::K(v) => Either16::K(v),
            Either16::L(v) => Either16::L(v),
            Either16::M(v) => Either16::M(v),
            Either16::N(v) => Either16::N(v),
            Either16::O(v) => Either16::O(v),
            Either16::P(v) => Either16::P(v),
        }
    }

    #[napi(setter, js_name = "value")]
    pub fn set_value(
        &mut self,
        value: Either16<
            String,
            Uint8Array,
            f64,
            u16,
            u32,
            BigIntString,
            bool,
            Vec<&DynamicValue>,
            BTreeMap<String, &DynamicValue>,
            Null,
            Undefined,
            i8,
            i16,
            i32,
            i64,
            u8,
        >,
    ) {
        // f64 go first, else number will be automatically converted to integer
        // arr go first also
        let owned = match value {
            Either16::A(v) => Either16::A(v),
            Either16::B(v) => Either16::B(v.to_vec()),
            Either16::C(v) => Either16::P(v),
            Either16::D(v) => Either16::D(v),
            Either16::E(v) => Either16::E(v),
            Either16::F(v) => Either16::F(v),
            Either16::G(v) => Either16::G(v),
            Either16::H(vec) => Either16::I(vec.into_iter().cloned().collect()),
            Either16::I(map) => Either16::H(map.into_iter().map(|(k, v)| (k, v.clone())).collect()),
            Either16::J(v) => Either16::J(v),
            Either16::K(v) => Either16::K(v),
            Either16::L(v) => Either16::L(v),
            Either16::M(v) => Either16::M(v),
            Either16::N(v) => Either16::N(v),
            Either16::O(v) => Either16::O(v),
            Either16::P(v) => Either16::C(v),
        };

        self.0 = owned;
    }

    #[napi(js_name = "isBigInt")]
    pub fn is_big_int(&self) -> bool {
        match self.0 {
            Either16::F(_) => true,
            _ => false,
        }
    }

    #[napi(js_name = "getType")]
    pub fn get_rs_type(&self) -> String {
        match self.0 {
            Either16::A(_) => "String",
            Either16::B(_) => "Vec<u8>",
            Either16::C(_) => "u8",
            Either16::D(_) => "u16",
            Either16::E(_) => "u32",
            Either16::F(_) => "BigIntString",
            Either16::G(_) => "bool",
            Either16::H(_) => "BTreeMap",
            Either16::I(_) => "Vec",
            Either16::J(_) => "Null",
            Either16::K(_) => "Undefined",
            Either16::L(_) => "i8",
            Either16::M(_) => "i16",
            Either16::N(_) => "i32",
            Either16::O(_) => "i64",
            Either16::P(_) => "f64",
        }
        .to_string()
    }
}

impl From<String> for DynamicValue {
    fn from(value: String) -> Self {
        DynamicValue::string(value)
    }
}

impl From<&str> for DynamicValue {
    fn from(value: &str) -> Self {
        DynamicValue::from(value.to_string())
    }
}

impl From<&[u8]> for DynamicValue {
    fn from(value: &[u8]) -> Self {
        DynamicValue::uint8_array(value.to_vec())
    }
}

impl From<Vec<u8>> for DynamicValue {
    fn from(value: Vec<u8>) -> Self {
        DynamicValue::uint8_array(value)
    }
}

impl From<u8> for DynamicValue {
    fn from(value: u8) -> Self {
        DynamicValue(Either16::C(value))
    }
}

impl From<u16> for DynamicValue {
    fn from(value: u16) -> Self {
        DynamicValue(Either16::D(value))
    }
}

impl From<u32> for DynamicValue {
    fn from(value: u32) -> Self {
        DynamicValue(Either16::E(value))
    }
}

impl From<u64> for DynamicValue {
    fn from(value: u64) -> Self {
        DynamicValue(Either16::F(BigIntString::from_u64(value)))
    }
}

impl From<bool> for DynamicValue {
    fn from(value: bool) -> Self {
        DynamicValue(Either16::G(value))
    }
}

impl DynamicValue {
    pub fn null() -> Self {
        DynamicValue(Either16::J(Null))
    }

    pub fn object(value: BTreeMap<String, DynamicValue>) -> Self {
        DynamicValue(Either16::H(value))
    }

    pub fn string(value: String) -> Self {
        DynamicValue(Either16::A(value))
    }

    pub fn uint8_array(value: Vec<u8>) -> Self {
        DynamicValue(Either16::B(value))
    }

    pub fn is_undefined(&self) -> bool {
        match self.0 {
            Either16::K(_) => true,
            _ => false,
        }
    }

    pub fn is_null(&self) -> bool {
        match self.0 {
            Either16::J(_) => true,
            _ => false,
        }
    }

    pub fn is_undefined_or_null(&self) -> bool {
        self.is_null() || self.is_undefined()
    }

    pub fn try_to_u64(&self) -> Result<u64, napi::Error> {
        match &self.0 {
            Either16::C(val) => Ok(val.clone() as u64),
            Either16::D(val) => Ok(val.clone() as u64),
            Either16::E(val) => Ok(val.clone() as u64),
            Either16::F(val) => val.try_to_u64(),
            Either16::A(val) => BigIntString::from(val).try_to_u64(),
            Either16::L(val) => Ok(val.clone() as u64),
            Either16::M(val) => Ok(val.clone() as u64),
            Either16::N(val) => Ok(val.clone() as u64),
            Either16::O(val) => Ok(val.clone() as u64),
            Either16::P(val) => {
                if val.fract() == 0.0
                    && val.clone() >= 0.0
                    && val.clone() <= u64::MAX as f64
                    && val.is_finite()
                {
                    Ok(val.clone() as u64)
                } else {
                    Err(napi::Error::new(
                        napi::Status::GenericFailure,
                        "Cannot convert value to u64",
                    ))
                }
            }
            _ => Err(napi::Error::new(
                napi::Status::GenericFailure,
                "Cannot convert value to u64",
            )),
        }
    }

    pub fn is_string(&self) -> bool {
        match self.0 {
            Either16::A(_) => true,
            _ => false,
        }
    }

    pub fn is_uint_8_array(&self) -> bool {
        match self.0 {
            Either16::B(_) => true,
            _ => false,
        }
    }

    pub fn is_uint8(&self) -> bool {
        match self.0 {
            Either16::C(_) => true,
            _ => false,
        }
    }

    pub fn is_uint16(&self) -> bool {
        match self.0 {
            Either16::D(_) => true,
            _ => false,
        }
    }

    pub fn is_uint32(&self) -> bool {
        match self.0 {
            Either16::E(_) => true,
            _ => false,
        }
    }

    pub fn is_uint64(&self) -> bool {
        match self.0 {
            Either16::F(_) => true,
            _ => false,
        }
    }

    pub fn is_int8(&self) -> bool {
        match self.0 {
            Either16::L(_) => true,
            _ => false,
        }
    }

    pub fn is_int16(&self) -> bool {
        match self.0 {
            Either16::M(_) => true,
            _ => false,
        }
    }

    pub fn is_int32(&self) -> bool {
        match self.0 {
            Either16::N(_) => true,
            _ => false,
        }
    }

    pub fn is_int64(&self) -> bool {
        match self.0 {
            Either16::O(_) => true,
            _ => false,
        }
    }

    pub fn is_f64(&self) -> bool {
        match self.0 {
            Either16::P(_) => true,
            _ => false,
        }
    }

    pub fn is_bool(&self) -> bool {
        match self.0 {
            Either16::G(_) => true,
            _ => false,
        }
    }

    pub fn is_object(&self) -> bool {
        match self.0 {
            Either16::H(_) => true,
            _ => false,
        }
    }

    pub fn is_array(&self) -> bool {
        match self.0 {
            Either16::I(_) => true,
            _ => false,
        }
    }

    pub fn is_number(&self) -> bool {
        self.is_uint8()
            || self.is_uint16()
            || self.is_uint32()
            || self.is_uint64()
            || self.is_int8()
            || self.is_int16()
            || self.is_int32()
            || self.is_int64()
            || self.is_f64()
    }

    pub fn as_string(&self) -> Option<String> {
        match &self.0 {
            Either16::A(string) => Some(string.clone()),
            _ => None,
        }
    }

    pub fn as_bytes(&self) -> Option<&Vec<u8>> {
        match &self.0 {
            Either16::B(bytes) => Some(bytes),
            _ => None,
        }
    }

    pub fn as_uint8(&self) -> Option<u8> {
        match self.0 {
            Either16::C(value) => Some(value),
            _ => None,
        }
    }

    pub fn as_uint16(&self) -> Option<u16> {
        match self.0 {
            Either16::C(val) => Some(val as u16),
            Either16::D(val) => Some(val),
            _ => None,
        }
    }

    pub fn as_uint32(&self) -> Option<u32> {
        match self.0 {
            Either16::C(val) => Some(val as u32),
            Either16::D(val) => Some(val as u32),
            Either16::E(val) => Some(val),
            _ => None,
        }
    }

    pub fn as_bool(&self) -> Option<bool> {
        match self.0 {
            Either16::G(val) => Some(val),
            _ => None,
        }
    }

    pub fn as_object(&self) -> Option<&BTreeMap<String, DynamicValue>> {
        match &self.0 {
            Either16::H(val) => Some(val),
            _ => None,
        }
    }

    pub fn as_array(&self) -> Option<&Vec<DynamicValue>> {
        match &self.0 {
            Either16::I(val) => Some(val),
            _ => None,
        }
    }
}

impl TryFrom<&DynamicValue> for u64 {
    type Error = napi::Error;

    fn try_from(value: &DynamicValue) -> Result<Self, Self::Error> {
        match value.is_number() {
            true => value.try_to_u64(),
            false => Err(napi::Error::new(
                napi::Status::GenericFailure,
                "Cannot convert value to number",
            )),
        }
    }
}

/// Withdrawal pooling strategy from its JS string form
/// ("Never" / "IfAvailable" / "Standard", case-insensitive).
pub fn pooling_from_string(value: String) -> Result<Pooling, napi::Error> {
    match value.to_lowercase().as_str() {
        "never" => Ok(Pooling::Never),
        "ifavailable" => Ok(Pooling::IfAvailable),
        "standard" => Ok(Pooling::Standard),
        _ => Err(napi::Error::new(Status::InvalidArg, "Invalid pooling value")),
    }
}

/// Withdrawal pooling strategy from its JS numeric form (0/1/2).
pub fn pooling_from_u64(value: u64) -> Result<Pooling, napi::Error> {
    match value {
        0 => Ok(Pooling::Never),
        1 => Ok(Pooling::IfAvailable),
        2 => Ok(Pooling::Standard),
        _ => Err(napi::Error::new(Status::InvalidArg, "Invalid pooling value")),
    }
}

/// Token distribution type from its JS string form
/// ("PreProgrammed" / "Perpetual" / "OncePerIdentity", case-insensitive).
pub fn distribution_type_from_string(value: String) -> Result<TokenDistributionType, napi::Error> {
    match value.to_lowercase().as_str() {
        "preprogrammed" => Ok(TokenDistributionType::PreProgrammed),
        "perpetual" => Ok(TokenDistributionType::Perpetual),
        "onceperidentity" => Ok(TokenDistributionType::OncePerIdentity),
        _ => Err(napi::Error::new(
            Status::InvalidArg,
            "Invalid TokenDistributionType value",
        )),
    }
}

/// Token distribution type from its JS numeric form (0/1/2).
pub fn distribution_type_from_u64(value: u64) -> Result<TokenDistributionType, napi::Error> {
    match value {
        0 => Ok(TokenDistributionType::PreProgrammed),
        1 => Ok(TokenDistributionType::Perpetual),
        2 => Ok(TokenDistributionType::OncePerIdentity),
        _ => Err(napi::Error::new(
            Status::InvalidArg,
            "Invalid TokenDistributionType value",
        )),
    }
}

/// Platform version from its JS numeric form (1..=14); anything else is an
/// error, exactly like the old `PlatformVersionNAPI::try_from(u64)`.
pub fn platform_version_from_u64(value: u64) -> Result<PlatformVersion, napi::Error> {
    match value {
        1 => Ok(PLATFORM_V1),
        2 => Ok(PLATFORM_V2),
        3 => Ok(PLATFORM_V3),
        4 => Ok(PLATFORM_V4),
        5 => Ok(PLATFORM_V5),
        6 => Ok(PLATFORM_V6),
        7 => Ok(PLATFORM_V7),
        8 => Ok(PLATFORM_V8),
        9 => Ok(PLATFORM_V9),
        10 => Ok(PLATFORM_V10),
        11 => Ok(PLATFORM_V11),
        12 => Ok(PLATFORM_V12),
        13 => Ok(PLATFORM_V13),
        14 => Ok(PLATFORM_V14),
        _ => Err(napi::Error::new(
            Status::InvalidArg,
            format!("unknown platform version value: {}", value),
        )),
    }
}

/// Core network from a JS value: a number (0=Mainnet, 1=Testnet, 2=Devnet,
/// 3=Regtest) or a case-insensitive name — the old
/// `NetworkNAPI::try_from(&DynamicValue)` mapping, straight to the domain type.
pub fn network_from_js(value: &DynamicValue) -> Result<Network, napi::Error> {
    if value.is_number() {
        match value.try_to_u64()? {
            0 => Ok(Network::Mainnet),
            1 => Ok(Network::Testnet),
            2 => Ok(Network::Devnet),
            3 => Ok(Network::Regtest),
            _ => Err(napi::Error::new(Status::InvalidArg, "Invalid network value")),
        }
    } else if value.is_string() {
        match value.as_string().unwrap().to_lowercase().as_str() {
            "mainnet" => Ok(Network::Mainnet),
            "testnet" => Ok(Network::Testnet),
            "devnet" => Ok(Network::Devnet),
            "regtest" => Ok(Network::Regtest),
            _ => Err(napi::Error::new(Status::InvalidArg, "Invalid network value")),
        }
    } else {
        Err(napi::Error::new(Status::InvalidArg, "Invalid network value"))
    }
}
