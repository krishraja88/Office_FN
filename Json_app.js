// import { XSLTProcessor } from 'xslt-processor';
// import { DOMParser, XMLSerializer } from 'xmldom';

document.querySelector('.btn.btn-primary').addEventListener('click', bracketRemove);
document.querySelector('.btn.btn-success').addEventListener('click', sr);
document.querySelector('.btn.btn-warning').addEventListener('click', fQTransform);
document.querySelector('.btn.btn-light').addEventListener('click', fQTransformOnly);
document.querySelector('.btn.btn-info').addEventListener('click', bookTransform);
document.querySelector('.btn.btn-danger').addEventListener('click', eraseAll);
document.getElementById('btn-json-farequote').addEventListener('click', jsonFareQuoteTransform);
document.getElementById('btn-json-search-to-fq').addEventListener('click', jsonSearchToFqReqJson);
document.getElementById('btn-json-fq-to-book').addEventListener('click', jsonFqRespToBookReqJson);

const currentYear = new Date().getFullYear();
const childAge = currentYear - 9;
const infantAge = currentYear - 1;
const seniorAge = currentYear - 62;
const AdultAge = currentYear - 30;

function generateRandomTimestamp() {
	return Math.floor(10000000 + Math.random() * 90000000);
}


async function bracketRemove() {
	let input = document.querySelector('.form-control.input').value;
	let output = document.querySelector('.form-control.output');

	input = input.replaceAll("&gt;", ">");
	input = input.replaceAll("&lt;", "<");
	input = input.replaceAll("&#xD;", "");

	// output.value = input;
	// await copySessionId();

	let firstIndex = input.indexOf("<SessionId>") + 11;
	let lastIndex = input.indexOf("</SessionId>");

	await navigator.clipboard.writeText(input.substring(firstIndex, lastIndex));

	await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 500ms

	output.value = input;

	await copy();
}

async function eraseAll() {
	let input = document.querySelector('.form-control.input');
	let output = document.querySelector('.form-control.output');

	output.value = "";
	input.value = "";
}

async function sr() {

	let input = document.querySelector('.form-control.input').value;
	let output = document.querySelector('.form-control.output');

	input = input.replaceAll("&gt;", ">");
	input = input.replaceAll("&lt;", "<");
	input = input.replaceAll("&#xD;", "");

	// output.value = input;
	// await copySessionId();

	let fi = input.indexOf("<SessionId>") + 11;
	let li = input.indexOf("</SessionId>");

	await navigator.clipboard.writeText(input.substring(fi, li));

	await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 500ms

	let firstIndex = input.indexOf("<SearchResult>");
	let lastIndex = input.indexOf("</SearchResult>") + 15;

	firstIndex != -1 ? input = input.substring(firstIndex, lastIndex) : input = "No Search Result Found";

	output.value = input;

	await copy();
}

async function copy() {
	let output = document.querySelector('.form-control.output');
	await navigator.clipboard.writeText(output.value);
}

async function copySessionId() {
	let output = document.querySelector('.form-control.output');
	let firstIndex = output.value.indexOf("<SessionId>") + 11;
	let lastIndex = output.value.indexOf("</SessionId>");

	await navigator.clipboard.writeText(output.value.substring(firstIndex, lastIndex));
}

async function fQTransform() {
	await sr();

	let input = document.querySelector('.form-control.output').value;
	let output = document.querySelector('.form-control.output');

	input = transformSearch(input, "Farequote")

	await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 500ms

	output.value = input;
	await copy();
}

async function fQTransformOnly() {
	let input = document.querySelector('.form-control.input').value;
	let output = document.querySelector('.form-control.output');

	output.value = transformSearch(input, "Farequote")

	await copy();
}

async function bookTransform() {
	let input = document.querySelector('.form-control.input').value;
	let output = document.querySelector('.form-control.output');

	output.value = transformSearch(input, "Book")
	await copy();
}

function escapeXml(text) {
	if (text == null || text === undefined) return '';
	return String(text)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;')
		.replace(/\r?\n/g, '');
}

function formatFqNumber(n) {
	if (n == null || n === '' || Number.isNaN(Number(n))) return '0';
	const x = Number(n);
	if (Number.isInteger(x) || Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x));
	return String(x);
}

function fareBasisForIndex(airProductDetails, idx) {
	const s = String(idx ?? '');
	const m = (airProductDetails || []).find((ap) => String(ap.flightInfoIndex) === s);
	return m ? m.fareBasisCode : '';
}
function fareFamilyForIndex(airProductDetails, idx) {
	const s = String(idx ?? '');
	const m = (airProductDetails || []).find((ap) => String(ap.flightInfoIndex) === s);
	return m ? m.fareFamilyCode : '';
}

function flightRefForIndex(airProductDetails, idx) {
	const s = String(idx ?? '');
	const m = (airProductDetails || []).find(
		(ap) => String(ap.flightInfoIndex ?? ap.FlightInfoIndex) === s
	);
	return m ? (m.flightRef ?? m.FlightRef ?? '') : '';
}

function eachSegment(flights2d, fn) {
	if (!Array.isArray(flights2d)) return;
	for (const journey of flights2d) {
		if (!Array.isArray(journey)) continue;
		for (const seg of journey) fn(seg);
	}
}

function buildBaggageBlock(tagName, bag) {
	if (!bag || typeof bag !== 'object') return '';
	const hasPiece = bag.noOfPiece != null && String(bag.noOfPiece).length;
	const hasFree = bag.freeText != null && String(bag.freeText).length;
	const hasUnit = bag.unit != null && String(bag.unit).length;
	const hasValue = bag.value != null && String(bag.value).length;
	if (!hasPiece && !hasFree && !hasUnit && !hasValue) return '';
	let inner = '';
	inner += hasFree ? `<FreeText>${escapeXml(bag.freeText)}</FreeText>` : '<FreeText/>';
	inner += hasPiece ? `<NoOfPiece>${escapeXml(bag.noOfPiece)}</NoOfPiece>` : '<NoOfPiece/>';
	inner += hasUnit ? `<Unit>${escapeXml(bag.unit)}</Unit>` : '<Unit/>';
	inner += hasValue ? `<Value>${escapeXml(bag.value)}</Value>` : '<Value/>';
	return `<${tagName}>${inner}</${tagName}>`;
}

function buildFareSegmentDetailsXml(sd, airProductDetails) {
	const idx = sd.FlightInfoIndex ?? sd.flightInfoIndex ?? '';
	const fareBasis = fareBasisForIndex(airProductDetails, idx);
	let inner = '';
	const cabin = buildBaggageBlock('CabinBaggage', sd.cabinBaggage);
	const checked = buildBaggageBlock('CheckedInBaggage', sd.checkedInBaggage);
	if (cabin) inner += cabin;
	if (checked) inner += checked;
	inner += `<FareBasis>${escapeXml(fareBasis)}</FareBasis>`;
	inner += '<SegRef/>';
	return `<SegmentDetails>${inner}</SegmentDetails>`;
}

function numFeeXml(tag, val) {
	const n = Number(val);
	if (n > 0) return `<${tag}>${formatFqNumber(val)}</${tag}>`;
	return `<${tag}>0</${tag}>`;
}

function buildFareXml(fare, airProductDetails) {
	let taxListInner = '';
	if (Array.isArray(fare.taxList) && fare.taxList.length) {
		for (const t of fare.taxList) {
			taxListInner += '<TaxBreakUp>';
			taxListInner += `<Amount>${formatFqNumber(t.amount)}</Amount>`;
			taxListInner += `<TaxType>${escapeXml(t.taxType)}</TaxType>`;
			taxListInner += '</TaxBreakUp>';
		}
	}
	let segInner = '<SegmentDetails>';
	if (Array.isArray(fare.segmentDetails)) {
		for (const sd of fare.segmentDetails) {
			segInner += buildFareSegmentDetailsXml(sd, airProductDetails);
		}
	}
	segInner += '</SegmentDetails>';
	const yq = fare.yqTax != null && Number(fare.yqTax) > 0
		? `<YQTax>${formatFqNumber(fare.yqTax)}</YQTax>`
		: '<YQTax>0</YQTax>';
	let s = '<Fare>';
	s += numFeeXml('AdditionalTxnFee', fare.additionalTxnFee);
	s += `<AirlineTransFee>${formatFqNumber(fare.airlineTransFee ?? 0)}</AirlineTransFee>`;
	s += `<BaseFare>${formatFqNumber(fare.baseFare)}</BaseFare>`;
	s += numFeeXml('Commission', fare.commission);
	s += numFeeXml('Discount', fare.discount);
	s += numFeeXml('Incentive', fare.incentive);
	s += numFeeXml('PLBAmount', fare.plbAmount);
	s += `<PassengerCount>${formatFqNumber(fare.passengerCount)}</PassengerCount>`;
	s += `<PassengerType>${escapeXml(fare.passengerType)}</PassengerType>`;
	s += segInner;
	s += `<Tax>${formatFqNumber(fare.tax)}</Tax>`;
	s += '<TaxList>';
	s += taxListInner;
	s += '</TaxList>';
	s += `<TotalFare>${formatFqNumber(fare.totalFare)}</TotalFare>`;
	s += yq;
	s += '</Fare>';
	return s;
}

function buildLocationXml(tag, loc) {
	if (!loc || typeof loc !== 'object') {
		return `<${tag}><AirportCode/><AirportName/><CityCode/><CityName/><CountryCode/><CountryName/></${tag}>`;
	}
	return `<${tag}>` +
		`<AirportCode>${escapeXml(loc.airportCode)}</AirportCode>` +
		`<AirportName>${escapeXml(loc.airportName)}</AirportName>` +
		`<CityCode>${escapeXml(loc.cityCode)}</CityCode>` +
		`<CityName>${escapeXml(loc.cityName)}</CityName>` +
		`<CountryCode>${escapeXml(loc.countryCode)}</CountryCode>` +
		`<CountryName>${escapeXml(loc.countryName)}</CountryName>` +
		`</${tag}>`;
}

function buildFlightInfoXml(seg, airProductDetails) {
	let s = '<FlightInfo>';
	const accTicks = seg.accumulatedDurationTicks;
	if (accTicks > 0) {
		s += `<AccumulatedDurationTicks>${formatFqNumber(accTicks)}</AccumulatedDurationTicks>`;
	}
	s += `<Airline>${escapeXml(seg.airline)}</Airline>`;
	if (seg.arrTerminal != null && String(seg.arrTerminal).length) {
		s += `<ArrTerminal>${escapeXml(seg.arrTerminal)}</ArrTerminal>`;
	}
	s += `<ArrivalTime>${escapeXml(seg.arrivalTime)}</ArrivalTime>`;
	s += `<Baggage>${escapeXml(seg.baggage)}</Baggage>`;
	s += `<BookingClass>${escapeXml(seg.bookingClass)}</BookingClass>`;
	if (seg.cabinBaggage != null && String(seg.cabinBaggage).length) {
		s += `<CabinBaggage>${escapeXml(seg.cabinBaggage)}</CabinBaggage>`;
	}
	if (seg.cabinClass != null && String(seg.cabinClass).length) {
		s += `<CabinClass>${escapeXml(seg.cabinClass)}</CabinClass>`;
	}
	if (seg.craft != null && String(seg.craft).length) {
		s += `<Craft>${escapeXml(seg.craft)}</Craft>`;
	}
	s += `<DepTerminal>${escapeXml(seg.depTerminal)}</DepTerminal>`;
	s += `<DepartureTime>${escapeXml(seg.departureTime)}</DepartureTime>`;
	s += buildLocationXml('Destination', seg.destination);
	const durTicks = seg.durationTicks;
	if (durTicks > 0) {
		s += `<DurationTicks>${formatFqNumber(durTicks)}</DurationTicks>`;
	}
	const et = seg.eTicketEligible !== false ? 'true' : 'false';
	s += `<ETicketEligible>${et}</ETicketEligible>`;
	s += `<FlightInfoIndex>${escapeXml(seg.flightInfoIndex)}</FlightInfoIndex>`;
	s += `<FlightNumber>${escapeXml(seg.flightNumber)}</FlightNumber>`;
	const flightRef = flightRefForIndex(airProductDetails, seg.flightInfoIndex)
		|| seg.flightRef || seg.FlightRef || '';
	s += flightRef.length
		? `<FlightRef>${escapeXml(flightRef)}</FlightRef>`
		: '<FlightRef/>';
	s += `<FlightStatus>${escapeXml(seg.flightStatus || 'Confirmed')}</FlightStatus>`;
	if (seg.noOfSeatAvailable != null && String(seg.noOfSeatAvailable).length) {
		s += `<NoOfSeatAvailable>${formatFqNumber(seg.noOfSeatAvailable)}</NoOfSeatAvailable>`;
	}
	s += `<OperatingCarrier>${escapeXml(seg.operatingCarrier)}</OperatingCarrier>`;
	s += buildLocationXml('Origin', seg.origin);
	if (seg.stopOver != null && String(seg.stopOver).length) {
		s += `<StopOver>${escapeXml(seg.stopOver)}</StopOver>`;
	}
	if (seg.stopPoint != null && String(seg.stopPoint).length) {
		s += `<StopPoint>${escapeXml(seg.stopPoint)}</StopPoint>`;
	}
	if (seg.stopPointArrivalTime != null && String(seg.stopPointArrivalTime).length
		&& seg.stopPointArrivalTime !== '0001-01-01T00:00:00') {
		s += `<StopPointArrivalTime>${escapeXml(seg.stopPointArrivalTime)}</StopPointArrivalTime>`;
	}
	if (seg.stopPointDepartureTime != null && String(seg.stopPointDepartureTime).length
		&& seg.stopPointDepartureTime !== '0001-01-01T00:00:00') {
		s += `<StopPointDepartureTime>${escapeXml(seg.stopPointDepartureTime)}</StopPointDepartureTime>`;
	}
	if (seg.stops != null && String(seg.stops).length) {
		s += `<Stops>${formatFqNumber(seg.stops)}</Stops>`;
	}
	s += '</FlightInfo>';
	return s;
}

function buildFlightsXml(flights2d, airProductDetails) {
	if (!Array.isArray(flights2d) || flights2d.length === 0) {
		return '<Flights/>';
	}
	let inner = '';
	for (const journey of flights2d) {
		if (!Array.isArray(journey)) continue;
		inner += '<ArrayOfFlightInfo>';
		for (const seg of journey) {
			inner += buildFlightInfoXml(seg, airProductDetails);
		}
		inner += '</ArrayOfFlightInfo>';
	}
	return `<Flights>${inner}</Flights>`;
}

function buildFareRulesXml(flights2d, airProductDetails) {
	let rules = '';
	eachSegment(flights2d, (seg) => {
		const fbc = fareBasisForIndex(airProductDetails, seg.flightInfoIndex);
		const ffc = fareFamilyForIndex(airProductDetails, seg.flightInfoIndex);
		rules += '<FareRule>';
		rules += `<Airline>${escapeXml(seg.airline)}</Airline>`;
		if (seg.departureTime != null && String(seg.departureTime).length) {
			rules += `<DepartureTime>${escapeXml(seg.departureTime)}</DepartureTime>`;
		}
		rules += `<Destination>${escapeXml(seg.destination?.airportCode)}</Destination>`;
		rules += `<FareBasisCode>${escapeXml(fbc)}</FareBasisCode>`;
		rules += `<FareFamilyCode>${escapeXml(ffc)}</FareFamilyCode>`;
		rules += '<FareRestriction/>';
		rules += '<FareRuleIndex/>';
		rules += '<JourneyId/>';
		rules += `<Origin>${escapeXml(seg.origin?.airportCode)}</Origin>`;
		rules += '</FareRule>';
	});
	return `<FareRules>${rules}</FareRules>`;
}

function sumFareField(fares, field) {
	if (!Array.isArray(fares)) return 0;
	return fares.reduce((a, f) => a + Number(f[field] ?? 0), 0);
}

function extractSessionIdFromSearchJson(parsed) {
	if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
	const keyOrder = ['sessionId', 'SessionId', 'session_id', 'sessionID'];
	const objectsToScan = [
		parsed,
		parsed.searchResult,
		parsed.result,
		parsed.data
	].filter((o) => o && typeof o === 'object' && !Array.isArray(o));
	for (const obj of objectsToScan) {
		for (const k of keyOrder) {
			const v = obj[k];
			if (v != null && String(v).trim().length) return String(v).trim();
		}
	}
	return null;
}

function normalizeSearchJsonToResult(parsed) {
	if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
		throw new Error('JSON must be an object: either a search response with a Results array, or a single search result with fareBreakupDetails.');
	}
	if (Array.isArray(parsed.Results) && parsed.Results.length > 0) {
		let result = parsed.Results[0];
		// Full search response: Results is an array of journey groups, each group is an array of results.
		if (Array.isArray(result) && result.length > 0) {
			result = result[0];
		}
		return result;
	}
	const nested = parsed.searchResult ?? parsed.result ?? parsed.data;
	if (nested && typeof nested === 'object' && !Array.isArray(nested)
		&& Array.isArray(nested.fareBreakupDetails) && nested.fareBreakupDetails.length > 0) {
		return nested;
	}
	if (Array.isArray(parsed.fareBreakupDetails) && parsed.fareBreakupDetails.length > 0) {
		return parsed;
	}
	throw new Error('JSON must include a non-empty Results array (full search response), or fareBreakupDetails on the root / searchResult / result / data object (single search result).');
}

function searchJsonToFareQuoteXml(parsed) {
	const result = normalizeSearchJsonToResult(parsed);
	if (!result.fareBreakupDetails || !Array.isArray(result.fareBreakupDetails) || result.fareBreakupDetails.length === 0) {
		throw new Error('Search result must have a non-empty fareBreakupDetails array.');
	}
	const pricing = result.fareBreakupDetails[0];
	const airPd = pricing.airProductDetails || [];
	const fares = pricing.fareBreakdown || [];
	const flights2d = result.flights || [];
	const firstSeg = flights2d[0]?.[0];
	const airline = pricing.validatingAirline || firstSeg?.airline || '';

	let fareBreakInner = '<FareBreakdown>';
	for (const fare of fares) {
		fareBreakInner += buildFareXml(fare, airPd);
	}
	fareBreakInner += '</FareBreakdown>';

	const publishedFare = sumFareField(fares, 'baseFare');
	const taxSum = sumFareField(fares, 'tax');
	const addTxnSum = sumFareField(fares, 'additionalTxnFee');
	const yqSum = sumFareField(fares, 'yqTax');

	const eticket = pricing.eticketEligible !== false ? 'true' : 'false';
	const nonRef = pricing.nonRefundable === true ? 'true' : 'false';
	const screenScrap = pricing.isScreenScrapped === true ? 'true' : 'false';
	const issuance = pricing.issuanceType != null && String(pricing.issuanceType).length
		? escapeXml(pricing.issuanceType)
		: 'HoldAndTicket';

	// ResultId is not present on JSON search results; default matches common single-result fare quote usage.
	const resultIdInt = 1;

	let xml = '<SearchResult>';
	xml += `<Airline>${escapeXml(airline)}</Airline>`;
	xml += `<AirlineRemark>${escapeXml(pricing.airlineRemark ?? '')}</AirlineRemark>`;
	xml += `<BaseFare>${formatFqNumber(pricing.baseFare)}</BaseFare>`;
	xml += `<BookingClass>${escapeXml(pricing.bookingClass)}</BookingClass>`;
	xml += `<Currency>${escapeXml(pricing.currency)}</Currency>`;
	xml += `<EticketEligible>${eticket}</EticketEligible>`;
	xml += fareBreakInner;
	const fareKey = pricing.fareKey ?? pricing.FareKey ?? '';
	xml += fareKey.length
		? `<FareKey>${escapeXml(fareKey)}</FareKey>`
		: '<FareKey/>';
	xml += buildFareRulesXml(flights2d, airPd);
	xml += `<FareType>${escapeXml(pricing.fareType || 'PUB')}</FareType>`;
	xml += buildFlightsXml(flights2d, airPd);
	xml += `<IndexForScreenScrap>${formatFqNumber(pricing.indexForScreenScrap ?? 0)}</IndexForScreenScrap>`;
	xml += `<IsScreenScrapped>${screenScrap}</IsScreenScrapped>`;
	xml += `<IssuanceType>${issuance}</IssuanceType>`;
	xml += `<NonRefundable>${nonRef}</NonRefundable>`;
	xml += '<Price>';
	xml += '<AccPriceType>PublishedFare</AccPriceType>';
	xml += `<AdditionalTxnFee>${formatFqNumber(addTxnSum)}</AdditionalTxnFee>`;
	xml += '<AirlineBaggageCharges>0</AirlineBaggageCharges>';
	xml += '<AirlineMealCharges>0</AirlineMealCharges>';
	xml += '<AirlineSSRCharges>0</AirlineSSRCharges>';
	xml += '<AirlineSeatCharges>0</AirlineSeatCharges>';
	xml += `<Currency>${escapeXml(pricing.currency)}</Currency>`;
	xml += '<Markup>0</Markup>';
	xml += '<NetFare>0</NetFare>';
	xml += '<OtherCharges>0</OtherCharges>';
	xml += `<PublishedFare>${formatFqNumber(publishedFare)}</PublishedFare>`;
	xml += '<RateOfExchange>0</RateOfExchange>';
	xml += `<Tax>${formatFqNumber(taxSum)}</Tax>`;
	xml += '<TransactionFee>0</TransactionFee>';
	xml += `<YQTax>${formatFqNumber(yqSum)}</YQTax>`;
	xml += '</Price>';
	xml += `<PrivateResultID>${formatFqNumber(pricing.privateResultID ?? 0)}</PrivateResultID>`;
	xml += `<PromoCode>${escapeXml(pricing.promoCode ?? '')}</PromoCode>`;
	xml += `<PromoCodeWarningText>${escapeXml(pricing.promoCodeWarningText ?? '')}</PromoCodeWarningText>`;
	xml += `<ResultBookingSource>${escapeXml(pricing.resultBookingSource)}</ResultBookingSource>`;
	xml += '<ResultId xmlns:arr="http://schemas.microsoft.com/2003/10/Serialization/Arrays">';
	xml += `<arr:int>${resultIdInt}</arr:int>`;
	xml += '</ResultId>';
	if (pricing.supplierSourceID != null && String(pricing.supplierSourceID).length) {
		xml += `<SupplierSourceID>${formatFqNumber(pricing.supplierSourceID)}</SupplierSourceID>`;
	}
	xml += `<Tax>${formatFqNumber(taxSum)}</Tax>`;
	xml += `<TicketAdvisory>${escapeXml(result.ticketAdvisory ?? '')}</TicketAdvisory>`;
	xml += `<TotalFare>${formatFqNumber(pricing.totalFare)}</TotalFare>`;
	xml += `<ValidatingAirline>${escapeXml(pricing.validatingAirline || airline)}</ValidatingAirline>`;
	xml += '</SearchResult>';
	return xml;
}

async function jsonFareQuoteTransform() {
	const inputEl = document.querySelector('.form-control.input');
	const output = document.querySelector('.form-control.output');
	let raw = inputEl.value.trim();
	try {
		const parsed = JSON.parse(raw);
		const sessionId = extractSessionIdFromSearchJson(parsed);
		if (sessionId) {
			try {
				await navigator.clipboard.writeText(sessionId);
			} catch (clipErr) {
				console.error('Session id clipboard write failed:', clipErr);
			}
			// Let the clipboard API finish before the long wait (helps Safari / strict contexts).
			await new Promise((resolve) => setTimeout(resolve, 150));
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
		output.value = searchJsonToFareQuoteXml(parsed);
		await copy();
	} catch (e) {
		output.value = e instanceof Error ? e.message : String(e);
	}
}

function transformSearch(searchResultSet, stepName) {

	// const xsltProcessor = new XSLTProcessor();
	const parser = new DOMParser();
	const serializer = new XMLSerializer();

	// Define the XSLT code
	let xsltCode = '';
	switch (stepName) {
		case "Book":
			xsltCode = XSLTconstant.BookXslt; // XSLT for 'Book' step
			break;
		case "Farequote":
			xsltCode = XSLTconstant.FarequoteXslt; // XSLT for 'Farequote' step
			break;
	}

	// Parse the XSLT and XML content
	const xsltDoc = new DOMParser().parseFromString(xsltCode, 'application/xml');
	const xmlDoc = new DOMParser().parseFromString(`<SearchResult>${searchResultSet.replace(/i:nil="true"/g, '')}</SearchResult>`, 'application/xml');

	// Create a new XSLT processor
	const xsltProcessor = new XSLTProcessor();
	xsltProcessor.importStylesheet(xsltDoc);

	// Apply transformation
	const transformedDoc = xsltProcessor.transformToDocument(xmlDoc);

	// Serialize the transformed document back to a string
	return new XMLSerializer().serializeToString(transformedDoc);
}


function normalizeKeys(obj) {
	if (obj == null || typeof obj !== 'object') return obj;
	if (Array.isArray(obj)) return obj.map(normalizeKeys);
	const out = {};
	for (const [k, v] of Object.entries(obj)) {
		const nk = k.charAt(0).toUpperCase() + k.slice(1);
		out[nk] = normalizeKeys(v);
	}
	return out;
}

function getResultsArray(parsed) {
	if (Array.isArray(parsed.Results) && parsed.Results.length > 0) {
		const first = parsed.Results[0];
		return Array.isArray(first) ? first : parsed.Results;
	}
	if (Array.isArray(parsed.results) && parsed.results.length > 0) {
		const first = parsed.results[0];
		return Array.isArray(first) ? first : parsed.results;
	}
	return null;
}

function selectResultAndFare(parsed, filterText) {
	const results = getResultsArray(parsed);
	if (!results || results.length === 0) {
		throw new Error('No Results array found in the search response JSON.');
	}

	if (!filterText || !filterText.trim()) {
		const r = results[0];
		const fbd = r.FareBreakupDetails || r.fareBreakupDetails || [];
		return { result: r, fare: fbd[0] || null };
	}

	const ft = filterText.trim().toLowerCase();

	for (const r of results) {
		const rStr = JSON.stringify(r).toLowerCase();
		if (rStr.includes(ft)) {
			const fbd = r.FareBreakupDetails || r.fareBreakupDetails || [];
			const fareMatch = fbd.find(f => JSON.stringify(f).toLowerCase().includes(ft));
			if (fareMatch) {
				return { result: r, fare: fareMatch };
			}
			return { result: r, fare: fbd[0] || null };
		}
	}

	for (const r of results) {
		const fbd = r.FareBreakupDetails || r.fareBreakupDetails || [];
		for (const f of fbd) {
			if (JSON.stringify(f).toLowerCase().includes(ft)) {
				return { result: r, fare: f };
			}
		}
	}

	const r = results[0];
	const fbd = r.FareBreakupDetails || r.fareBreakupDetails || [];
	return { result: r, fare: fbd[0] || null };
}

function collectAirlineCodes(result) {
	const codes = new Set();
	const flights = result.Flights || result.flights || [];
	for (const journey of flights) {
		if (!Array.isArray(journey)) continue;
		for (const seg of journey) {
			const code = seg.AirlineCode || seg.airlineCode;
			if (code) codes.add(code);
		}
	}
	return [...codes];
}

function buildClientDetails(sessionId) {
	return {
		SessionID: sessionId || '',
		UserIP: '192.168.1.100',
		AgencyId: 'AGN001',
		ClientAgencyType: 'B2B',
		UserName: 'tektravel',
		Password: '12345'
	};
}

function buildSourceContext(fare, incAirlines) {
	const pkd = fare.PricingKeyDetail || fare.pricingKeyDetail;
	const pricingArr = pkd ? (Array.isArray(pkd) ? pkd : [pkd]) : [];
	return {
		SourceDetails: [{
			Source: fare.Source || fare.source || '',
			CredCfg: { UserName: 'suppuser', Password: 'supppass' },
			IncAirlines: incAirlines || [],
			ExcAirlines: [],
			IdentificationCode: fare.IdentificationCode || fare.identificationCode || '',
			PricingKeyDetail: pricingArr,
			PromoCode: fare.PromoCode || fare.promoCode || ''
		}]
	};
}

async function jsonSearchToFqReqJson() {
	const inputEl = document.querySelector('.form-control.input');
	const output = document.querySelector('.form-control.output');
	const filterEl = document.getElementById('json-filter-text');
	const filterText = filterEl ? filterEl.value : '';

	try {
		const parsed = JSON.parse(inputEl.value.trim());
		const sessionId = parsed.SessionId || parsed.sessionId || parsed.session_id || '';

		if (sessionId) {
			try { await navigator.clipboard.writeText(sessionId); } catch (_) { }
			await new Promise(r => setTimeout(r, 150));
			await new Promise(r => setTimeout(r, 1000));
		}

		const { result, fare } = selectResultAndFare(parsed, filterText);
		if (!fare) throw new Error('No FareBreakupDetails found in the selected result.');

		const airlines = collectAirlineCodes(result);

		const resultCopy = JSON.parse(JSON.stringify(result));
		resultCopy.FareBreakupDetails = [fare];

		const fqReq = {
			ClientDetails: buildClientDetails(sessionId),
			SourceContext: buildSourceContext(fare, airlines),
			SearchResult: resultCopy
		};

		output.value = JSON.stringify(fqReq, null, 4);
		await copy();
	} catch (e) {
		output.value = e instanceof Error ? e.message : String(e);
	}
}

function passengerTypeToBookType(passengerType) {
	const normalizedType = String(passengerType || '').trim().toLowerCase();
	if (normalizedType === 'child' || normalizedType === 'chd') return 2;
	if (normalizedType === 'infant' || normalizedType === 'inf') return 3;
	if (normalizedType === 'senior' || normalizedType === 'src') return 4;
	return 1;
}

function resolveBookPassengerType(fareRow) {
	const raw = fareRow.PassengerType ?? fareRow.passengerType ?? fareRow.Type ?? fareRow.type;
	if (raw == null || raw === '') return 1;
	if (typeof raw === 'number' && !Number.isNaN(raw)) return raw;
	const asNumber = Number(raw);
	if (!Number.isNaN(asNumber) && String(raw).trim() === String(asNumber)) return asNumber;
	return passengerTypeToBookType(raw);
}

function resolvePassengerTypeLabel(fareRow) {
	const raw = fareRow.PassengerType ?? fareRow.passengerType ?? fareRow.Type ?? fareRow.type;
	if (raw == null || raw === '') return 'Adult';
	if (typeof raw === 'number' || (!Number.isNaN(Number(raw)) && String(raw).trim() === String(Number(raw)))) {
		const typeByNumber = { 1: 'Adult', 2: 'Child', 3: 'Infant', 4: 'Senior' };
		return typeByNumber[Number(raw)] || 'Adult';
	}
	return String(raw);
}

function extractFareBreakdownRows(source) {
	if (!source || typeof source !== 'object') return [];

	const fareBreakup = source.FareBreakupDetails?.[0] || source.fareBreakupDetails?.[0];
	const candidates = [
		source.FareBreakdown,
		source.fareBreakdown,
		fareBreakup?.FareBreakdown,
		fareBreakup?.fareBreakdown
	];

	for (const candidate of candidates) {
		if (!candidate) continue;

		if (Array.isArray(candidate)) {
			if (candidate.length === 0) continue;
			const first = candidate[0];
			const looksLikeFareRow = first && (
				first.PassengerType != null || first.passengerType != null
				|| first.Type != null || first.type != null
				|| first.PassengerCount != null || first.passengerCount != null
			) && (
					first.Source == null && first.source == null
					&& first.FareKey == null && first.fareKey == null
					&& first.AirProductDetails == null && first.airProductDetails == null
				);
			if (looksLikeFareRow) return candidate;

			const nestedFares = candidate.flatMap((item) => {
				if (!item || typeof item !== 'object') return [];
				const fares = item.Fare ?? item.fare ?? item.FareBreakdown ?? item.fareBreakdown;
				return Array.isArray(fares) ? fares : (fares ? [fares] : []);
			});
			if (nestedFares.length) return nestedFares;
			continue;
		}

		if (typeof candidate === 'object') {
			const fares = candidate.Fare ?? candidate.fare;
			if (Array.isArray(fares)) return fares;
			if (fares && typeof fares === 'object') return [fares];
		}
	}

	return [];
}

function dateOfBirthForPassengerType(passengerType) {

	const normalizedType = String(passengerType || '').trim().toLowerCase();
	if (normalizedType === 'infant' || normalizedType === 'inf') return `${infantAge}-07-01T00:00:00Z`;
	else if (normalizedType === 'child' || normalizedType === 'chd') return `${currentYear - 7}-01-01T00:00:00Z`;
	else if (normalizedType === 'adult' || normalizedType === 'adt') return `${currentYear - 25}-01-01T00:00:00Z`;
	else if (normalizedType === 'senior' || normalizedType === 'adt') return `${currentYear - 60}-01-01T00:00:00Z`;
	return '1990-05-15T00:00:00Z';
}

function identityCardIssueDateForPassengerType(passengerType) {
	const normalizedType = String(passengerType || '').trim().toLowerCase();
	if (normalizedType === 'infant' || normalizedType === 'inf') {
		return `${currentYear - 1}-01-01T00:00:00Z`;
	}
	return `${currentYear - 5}-01-01T00:00:00Z`;
}

function identityCardExpiryDateForPassengerType(passengerType) {
	return `${currentYear + 10}-01-01T00:00:00Z`;
}

const SAMPLE_PASSENGER_NAMES = [
	{ firstName: 'Raju', lastName: 'Kumar', title: 'Mr', gender: 1 },
	{ firstName: 'Darpan', lastName: 'Gupta', title: 'Mr', gender: 1 },
	{ firstName: 'Pankaj', lastName: 'Kumar', title: 'Mr', gender: 1 },
	{ firstName: 'Ayush', lastName: 'Jain', title: 'Mr', gender: 1 },
	{ firstName: 'Vishal', lastName: 'Dua', title: 'Mr', gender: 1 },
	{ firstName: 'Mahendra Singh', lastName: 'Dhoni', title: 'Mr', gender: 1 },
	{ firstName: 'Rajesh', lastName: 'Kumar', title: 'Mr', gender: 1 },
	{ firstName: 'Manisha', lastName: 'Gupta', title: 'Ms', gender: 2 },
	{ firstName: 'Virat', lastName: 'Kohli', title: 'Mr', gender: 1 },
];

function passengerNameForIndex(passengerIndex) {
	return SAMPLE_PASSENGER_NAMES[passengerIndex % SAMPLE_PASSENGER_NAMES.length];
}
function passportNumber() {
	return Math.floor(10000000 + Math.random() * 90000000);
}
function apdForFlightInfoIndex(airProductDetails, flightInfoIndex) {
	const idx = String(flightInfoIndex ?? '');
	return (airProductDetails || []).find(
		(a) => String(a.FlightInfoIndex ?? a.flightInfoIndex) === idx
	);
}

function mapSegmentDetailsForFare(fareRow, airProductDetails, segments) {
	const rawSegmentDetails = fareRow.SegmentDetails || fareRow.segmentDetails || [];
	const sourceDetails = rawSegmentDetails.length
		? rawSegmentDetails
		: (segments || []).map((seg) => ({ FlightInfoIndex: seg.FlightInfoIndex }));

	return sourceDetails.map((sd) => {
		const idx = String(sd.FlightInfoIndex ?? sd.flightInfoIndex ?? '');
		const matchApd = apdForFlightInfoIndex(airProductDetails, idx);
		const matchSeg = (segments || []).find((s) => String(s.FlightInfoIndex) === idx);
		return {
			FlightInfoIndex: idx || '0',
			FareBasis: sd.FareBasis || sd.fareBasis || matchApd?.FareBasisCode || matchApd?.fareBasisCode || '',
			BookingClass: sd.BookingClass || sd.bookingClass
				|| matchApd?.BookingClass || matchApd?.bookingClass
				|| matchSeg?.BookingClass || '',
			CabinBaggage: sd.CabinBaggage || sd.cabinBaggage || null,
			CheckedInBaggage: sd.CheckedInBaggage || sd.checkedInBaggage || null
		};
	});
}

function fareRowPaxTypeOrder(fareRow) {
	const label = resolvePassengerTypeLabel(fareRow).toLowerCase();
	if (label === 'adult') return 1;
	if (label === 'senior') return 2;
	if (label === 'child' || label === 'chd') return 3;
	if (label === 'infant' || label === 'inf') return 4;
	return 5;
}

function sortFareBreakdownByPaxType(fareBreakdown) {
	return [...fareBreakdown].sort((a, b) => fareRowPaxTypeOrder(a) - fareRowPaxTypeOrder(b));
}

function mapFlightSegmentFromFq(seg, journeyIdx, segIdx, globalSegIdx) {
	const flightInfoIndex = String(
		seg.FlightInfoIndex ?? seg.flightInfoIndex ?? String(globalSegIdx + 1)
	);
	return {
		FlightNumber: seg.FlightNumber || seg.flightNumber || '',
		AirlineCode: seg.AirlineCode || seg.airlineCode || '',
		Origin: seg.Origin || seg.origin || '',
		Destination: seg.Destination || seg.destination || '',
		DepTime: seg.DepTime || seg.depTime || seg.DepartureTime || seg.departureTime || '',
		ArrTime: seg.ArrTime || seg.arrTime || seg.ArrivalTime || seg.arrivalTime || '',
		DepTerminal: seg.DepTerminal || seg.depTerminal || '',
		ArrTerminal: seg.ArrTerminal || seg.arrTerminal || '',
		Duration: seg.Duration || seg.duration || 0,
		NumStops: seg.NumStops || seg.numStops || 0,
		CabinClass: seg.CabinClass || seg.cabinClass || 'Economy',
		BookingClass: seg.BookingClass || seg.bookingClass || '',
		OperatingCarrier: seg.OperatingCarrier || seg.operatingCarrier || '',
		Equipment: seg.Equipment || seg.equipment || '',
		CraftType: seg.CraftType || seg.craftType || '',
		StopPointArrivalTime: seg.StopPointArrivalTime || seg.stopPointArrivalTime || null,
		StopPointDepartureTime: seg.StopPointDepartureTime || seg.stopPointDepartureTime || null,
		FlightInfoIndex: flightInfoIndex,
		FlightRef: `FL-${flightInfoIndex.padStart(3, '0')}`,
		TripIndicator: journeyIdx + 1,
		SegmentIndicator: segIdx + 1,
		NoOfSeatAvailable: seg.NoOfSeatAvailable || seg.noOfSeatAvailable || 0,
		MarriageGrpInd: seg.MarriageGrpInd || seg.marriageGrpInd || '',
		Baggage: seg.Baggage || seg.baggage || '',
		CabinBaggage: seg.CabinBaggage || seg.cabinBaggage || '',
		Status: seg.Status || seg.status || 'HK',
		ProductClass: seg.ProductClass || seg.productClass || ''
	};
}

function flattenFlightSegmentsFromFq(flights2d) {
	const segments = [];
	if (!Array.isArray(flights2d)) return segments;
	let globalIdx = 0;
	for (let journeyIdx = 0; journeyIdx < flights2d.length; journeyIdx++) {
		const journey = flights2d[journeyIdx];
		if (!Array.isArray(journey)) continue;
		for (let segIdx = 0; segIdx < journey.length; segIdx++) {
			segments.push(mapFlightSegmentFromFq(journey[segIdx], journeyIdx, segIdx, globalIdx));
			globalIdx += 1;
		}
	}
	return segments;
}

function buildPassengerFromFareRow(fareRow, options) {
	const {
		fare,
		segments,
		airlineCode,
		cancelPenalty,
		isLeadPax,
		passengerIndex
	} = options;

	const paxCount = Number(fareRow.PassengerCount || fareRow.passengerCount || 1) || 1;
	const baseFare = Number(fareRow.BaseFare || fareRow.baseFare || 0);
	const taxTotal = Number(fareRow.Tax || fareRow.tax || 0);
	const yqTax = Number(fareRow.YQTax || fareRow.yqTax || 0);
	const perPaxBase = baseFare / paxCount;
	const perPaxTax = taxTotal / paxCount;
	const perPaxYq = yqTax / paxCount;
	const publishedFare = perPaxBase;
	const taxList = (fareRow.TaxList || fareRow.taxList || []).map(t => ({
		Amount: Number(t.Amount || t.amount || 0) / paxCount,
		TaxType: t.TaxType || t.taxType || ''
	}));
	const paxId = String(passengerIndex + 1).padStart(3, '0');
	const passengerType = resolvePassengerTypeLabel(fareRow);
	const nameInfo = passengerNameForIndex(passengerIndex);

	if (passengerIndex == 0) {
		let randomString = '';
		while (randomString.length < 4) {
			randomString += Math.random().toString(36).replace(/[^a-z]/g, '');
		}
		randomString = randomString.substring(0, 4);
		nameInfo.firstName = nameInfo.firstName + randomString;
		nameInfo.lastName = nameInfo.lastName + randomString;
	}

	return {
		FirstName: nameInfo.firstName,
		LastName: nameInfo.lastName,
		Title: nameInfo.title,
		CellCountryCode: '91',
		CellPhone: '9876543210',
		IsLeadPax: isLeadPax,
		DateOfBirth: dateOfBirthForPassengerType(passengerType),
		Type: resolveBookPassengerType(fareRow),
		PassportNo: `${passportNumber()}`,
		Nationality: 'IN',
		City: 'New Delhi',
		AddressLine1: '123 MG Road',
		AddressLine2: 'Sector 5',
		Gender: nameInfo.gender,
		PaxBaggage: [],
		PaxMeal: [],
		PaxSeat: [],
		PaxSSRService: [],
		Email: 'rahul.sharma@example.com',
		Meal: { Code: 'VGML', Description: 'Vegetarian Meal' },
		PaxPreference: { Code: 'WHEELCHAIR', Description: 'Wheelchair required' },
		Seat: { Code: 'WINDOW', Description: 'Window Seat' },
		Price: {
			PublishedFare: publishedFare,
			NetFare: publishedFare - 300,
			Markup: 100,
			OtherCharges: 50,
			Tax: perPaxTax,
			TransactionFee: 25,
			Currency: fare.Currency || fare.currency || 'INR',
			AccPriceType: 1,
			RateOfExchange: 1.0,
			AdditionalTxnFee: 0,
			YQTax: perPaxYq,
			AirlineBaggageCharges: 0,
			AirlineMealCharges: 0,
			AirlineSeatCharges: 0,
			AirlineSSRCharges: 0,
			TaxBreakup: taxList,
			CancelCharges: Number(cancelPenalty),
			RefundAmount: 0,
			CreditCardCharges: 0,
			Commission: 50,
			Incentive: 10,
			Discount: 0,
			PLBAmount: 0,
			FlightIDRefList: segments.map(s => s.FlightRef)
		},
		Prices: [],
		FFAirline: airlineCode,
		FFNumber: 'FF123456',
		PaxKey: `PAX-${paxId}`,
		PaxKeyRef: `REF-${paxId}`,
		PassportExpiry: identityCardExpiryDateForPassengerType(passengerType),
		TicketNumber: '',
		FlightBoardedStatus: [],
		PostalCode: '110001',
		IdDetails: {
			IdCardCode: 'PP',
			IdNumber: `${passportNumber()}`,
			AlphaCheck: '',
			ZipCode: '110001',
			DiscountCode: '',
			IdentityCardIssueDate: identityCardIssueDateForPassengerType(passengerType),
			IdentityCardExpiryDate: identityCardExpiryDateForPassengerType(passengerType),
			DocumentIssuingCountry: 'IN',
			IdCardType: 'Passport',
			IdProofPath: ''
		},
		DocumentDetails: [],
		ContactDetails: [{
			ContactType: 'Emergency',
			PhoneNumber: '9876543211',
			PhonePrefix: '91',
			Email: 'emergency@example.com',
			Remarks: ''
		}],
		DiscountType: 'NotSet',
		PassportIssueCountryCode: 'IN',
		PassportIssueIsoCountryCode: 'IN',
		PassportIssueCity: 'New Delhi',
		HesCode: '',
		PassportIssueDate: identityCardIssueDateForPassengerType(passengerType),
		GSTNumber: '22AAAAA0000A1Z5',
		GSTContactNumber: '9876543210',
		GSTName: 'ABC Travels',
		GSTAddress: '456 Business Park',
		GSTEmail: 'gst@abctravels.com',
		PhoneDetails: [{
			PhoneType: 'Mobile',
			Number: '9876543210',
			InternationalCode: '91',
			AreaCode: '011',
			Extension: ''
		}],
		AddressDetails: [{
			AddressLine1: '123 MG Road',
			AddressLine2: 'Sector 5',
			PostalCode: '110001',
			CellPhoneNumber: '9876543210',
			CellCountryCode: '91',
			EmailId: 'rahul.sharma@example.com',
			ProvinceState: 'Delhi',
			City: 'New Delhi'
		}],
		GSTCity: 'New Delhi',
		GSTCountryName: 'India',
		GSTPostalCode: '110001',
		GSTCountryCode: 'IN',
		GSTState: 'Delhi',
		SegmentDetails: mapSegmentDetailsForFare(fareRow, options.airProductDetails || [], options.segments || [])
	};
}

async function jsonFqRespToBookReqJson() {
	const inputEl = document.querySelector('.form-control.input');
	const output = document.querySelector('.form-control.output');

	try {
		const parsed = JSON.parse(inputEl.value.trim());
		const sessionId = parsed.SessionId || parsed.sessionId || parsed.session_id || '';

		if (sessionId) {
			try { await navigator.clipboard.writeText(sessionId); } catch (_) { }
			await new Promise(r => setTimeout(r, 150));
			await new Promise(r => setTimeout(r, 1000));
		}

		const sr = parsed.SearchResult || parsed.searchResult;
		if (!sr) throw new Error('No SearchResult found in the Farequote Response JSON.');

		const fbd = sr.FareBreakupDetails || sr.fareBreakupDetails || [];
		if (!fbd.length) throw new Error('No FareBreakupDetails found in SearchResult.');
		const fare = fbd[0];

		let fareBreakdown = extractFareBreakdownRows(fare);
		if (!fareBreakdown.length) fareBreakdown = extractFareBreakdownRows(sr);
		if (!fareBreakdown.length) {
			throw new Error('No FareBreakdown found in SearchResult.');
		}
		fareBreakdown = sortFareBreakdownByPaxType(fareBreakdown);

		const flights = sr.Flights || sr.flights || [];
		const segments = flattenFlightSegmentsFromFq(flights);
		if (!segments.length) {
			throw new Error('No flight segments found in SearchResult.Flights.');
		}

		const firstSeg = segments[0] || {};
		const lastSeg = segments[segments.length - 1] || {};
		const airlineCode = fare.ValidatingAirline || fare.validatingAirline || firstSeg.AirlineCode || '';
		const airlines = collectAirlineCodes(sr);

		const apd = fare.AirProductDetails || fare.airProductDetails || [];

		const fareRules = segments.map(seg => {
			const matchApd = apdForFlightInfoIndex(apd, seg.FlightInfoIndex) || {};
			return {
				Origin: seg.Origin,
				Destination: seg.Destination,
				Airline: seg.AirlineCode,
				FareBasis: matchApd.FareBasisCode || matchApd.fareBasisCode || '',
				FareBasisCode: matchApd.FareBasisCode || matchApd.fareBasisCode || '',
				FareFamilyCode: matchApd.FareFamilyCode || matchApd.fareFamilyCode || '',
				RuleDetail: fare.AirlineRemark || fare.airlineRemark || '',
				FareRestriction: (fare.IsRefundable || fare.isRefundable) ? 'Refundable' : 'NonRefundable',
				FareRuleIndex: seg.FlightInfoIndex,
				JourneyId: `J${seg.TripIndicator || 1}`,
				DepartureTime: seg.DepTime
			};
		});

		const cancelPenalty = fare.Penalty?.CancelPenaltyAmount
			|| fare.penalty?.cancelPenaltyAmount || 0;

		const depTime = firstSeg.DepTime || '';
		const travelDate = depTime ? depTime.split('T')[0] + 'T00:00:00' : '';

		const passengers = [];
		let globalPassengerIndex = 0;
		for (const fareRow of fareBreakdown) {
			const count = Number(fareRow.PassengerCount ?? fareRow.passengerCount ?? 0);
			if (count <= 0) continue;
			for (let i = 0; i < count; i++) {
				passengers.push(buildPassengerFromFareRow(fareRow, {
					fare,
					segments,
					airProductDetails: apd,
					airlineCode,
					cancelPenalty,
					isLeadPax: globalPassengerIndex === 0,
					passengerIndex: globalPassengerIndex
				}));
				globalPassengerIndex += 1;
			}
		}

		if (!passengers.length) {
			throw new Error('No passengers found in FareBreakdown (missing or zero PassengerCount).');
		}

		const bookReq = {
			ClientDetails: buildClientDetails(sessionId),
			SourceContext: buildSourceContext(fare, airlines),
			FlightItinerary: {
				Segments: segments,
				FareRules: fareRules,
				FareKey: fare.FareKey || fare.fareKey || '',
				FlightBookingSource: fare.Source || fare.source || '',
				SupplierSourceID: 6,
				Origin: firstSeg.Origin || '',
				Destination: lastSeg.Destination || '',
				PNR: '',
				Passenger: passengers,
				IssuanceType: fare.IssuanceType || fare.issuanceType || 'ETicket',
				SessionId: sessionId,
				UniqueId: 'UNIQ-BK-' + String(generateRandomTimestamp()).slice(0, 3),
				TravelDate: travelDate,
				ValidatingAirlineCode: airlineCode,
				AliasAirlineCode: '',
				AirlineCode: airlineCode,
				ClientName: 'ABC Travels',
				UserName: 'testuser',
				DiscountFareType: 'NotSet',
				BookType: 1
			}
		};

		output.value = JSON.stringify(bookReq, null, 4);
		await copy();
	} catch (e) {
		output.value = e instanceof Error ? e.message : String(e);
	}
}

const XSLTconstant = {
	BookXslt: "<xsl:stylesheet version=\"1.0\" xmlns:xsl=\"http://www.w3.org/1999/XSL/Transform\"\n" +
		"                 xmlns:i=\"http://www.w3.org/2001/XMLSchema-instance\"\n" +
		"    xmlns:msxsl=\"urn:schemas-microsoft-com:xslt\" exclude-result-prefixes=\"msxsl\">\n" +
		"  <xsl:output method=\"xml\" indent=\"yes\"/>\n" +
		"\n" +
		"\n" +
		"  <xsl:variable name=\"FareRules\">\n" +
		"    <xsl:copy-of select=\"//SearchResult/FareRules\"/>\n" +
		"  </xsl:variable>\n" +
		"\n" +
		"  <xsl:variable name=\"currency\" select=\"//SearchResult/Currency\" />\n" +
		"\n"
		+ "<xsl:variable name=\"responseParams\">\n"
		+ "<xsl:copy-of select=\"//SearchResult/ResponseParams/*\"/>\n"
		+ "</xsl:variable>\n" +
		"\n" +
		"  <xsl:variable name=\"segments\">\n" +
		"    <xsl:copy-of select=\"//SearchResult/Flights/ArrayOfFlightInfo/FlightInfo\"/>\n" +
		"  </xsl:variable>\n" +
		"\n" +
		"  <xsl:variable name=\"FinalOutput\">\n" +
		"    <AgencyDetails>\n" +
		"      <Address>Phase 5, Udyog Vihar, Gurgaon</Address>\n" +
		"      <AgencyName>ABC Agency Pvt Ltd</AgencyName>\n" +
		"      <City>Gurgaon</City>\n" +
		"      <EmailId>ayush.jain@travelboutiqueonline.com</EmailId>\n" +
		"      <Fax />\n" +
		"      <Phone>7799364734</Phone>\n" +
		"    </AgencyDetails>\n" +
		"    <AirlineCode>\n" +
		"      <xsl:value-of select=\"//SearchResult/Airline\"/>\n" +
		"    </AirlineCode>\n" +
		"    <AirlineCommission>0</AirlineCommission>\n" +
		"    <AliasAirlineCode>\n" +
		"      <xsl:value-of select=\"//SearchResult/ValidatingAirline\"/>\n" +
		"    </AliasAirlineCode>\n" +
		"    <BookRequestXML>\n" +
		"      <xsl:value-of select=\"''\"/>\n" +
		"    </BookRequestXML>\n" +
		"    <BookingMode>Auto</BookingMode>\n" +
		"    <BookingRemarks xmlns:arr=\"http://schemas.microsoft.com/2003/10/Serialization/Arrays\">\n" +
		"      <!--Zero or more repetitions:-->\n" +
		"      <arr:string>\n" +
		"        <xsl:value-of select=\"''\"/>\n" +
		"      </arr:string>\n" +
		"    </BookingRemarks>\n" +
		"    <CcPayment>\n" +
		"      <Amount>0</Amount>\n" +
		"      <!--<AuthCode>?</AuthCode>-->\n" +
		"      <BillingAddress>\n" +
		"        <Address>724, Tek Travels Pvt. Ltd.</Address>\n" +
		"        <City>Gurugaram</City>\n" +
		"        <Country>IN</Country>\n" +
		"        <State>Haryana</State>\n" +
		"        <ZipCode>122016</ZipCode>\n" +
		"      </BillingAddress>\n" +
		"      <Card>\n" +
		"        <CVV>123</CVV>\n" +
		"        <Company></Company>\n" +
		"        <ExpDate>0621</ExpDate>\n" +
		"        <Name>Ayush</Name>\n" +
		"        <Number>5111111111111118</Number>\n" +
		"      </Card>\n" +
		"      <Currency><xsl:value-of select=\"$currency\"/></Currency>\n" +
		"    </CcPayment>\n" +
		"    <Destination>\n" +
		"      <xsl:value-of select=\"//SearchResult/Flights/ArrayOfFlightInfo/FlightInfo[position()=last()]/Destination/AirportCode\"/>\n" +
		"    </Destination>\n" +
		"    <DiscountFareType>NotSet</DiscountFareType>\n" +
		"    <Endorsement>\n" +
		"      <xsl:value-of select=\"''\"/>\n" +
		"    </Endorsement>\n" +
		"    <ExpectedTotalFare>\n" +
		"      <xsl:value-of select=\"//SearchResult/TotalFare\"/>\n" +
		"    </ExpectedTotalFare>\n"
		+ "      <FareKey>\r\n"
		+ "        <xsl:value-of select=\"//SearchResult/FareKey\"/>\r\n"
		+ "      </FareKey>\r\n" +
		"    <xsl:copy-of select=\"$FareRules\"/>\n" +
		"    <FareType>PUB</FareType>\n" +
		"    <FlightBookingSource>\n" +
		"      <xsl:value-of select=\"//SearchResult/ResultBookingSource\"/>\n" +
		"    </FlightBookingSource>\n" +
		"    <IsDomestic>true</IsDomestic>\n" +
		"    <xsl:if test=\"string-length(//SearchResult/IsScreenScrapped) > 0\">\n" +
		"      <IsScreenScrapped>\n" +
		"        <xsl:value-of select=\"//SearchResult/IsScreenScrapped\"/>\n" +
		"      </IsScreenScrapped>\n" +
		"    </xsl:if>\n" +
		"    <IssuanceType>\n" +
		"      <xsl:choose>\n" +
		"        <xsl:when test=\"string-length(//SearchResult/IssuanceType) > 0\">\n" +
		"          <xsl:value-of select=\"//SearchResult/IssuanceType\"/>\n" +
		"        </xsl:when>\n" +
		"        <xsl:otherwise>\n" +
		"          <xsl:text>HoldAndTicket</xsl:text>\n" +
		"        </xsl:otherwise>\n" +
		"      </xsl:choose>\n" +
		"    </IssuanceType>\n" +
		"    <LastTicketDate>\n" +
		"      <xsl:value-of select=\"//SearchResult/Flights/ArrayOfFlightInfo//FlightInfo/DepartureTime\"/>\n" +
		"    </LastTicketDate>\n" +
		"    <NonRefundable>\n" +
		"      <xsl:choose>\n" +
		"        <xsl:when test=\"string-length(//SearchResult/NonRefundable) > 0\">\n" +
		"          <xsl:value-of select=\"//SearchResult/NonRefundable\"/>\n" +
		"        </xsl:when>\n" +
		"        <xsl:otherwise>\n" +
		"          <xsl:text>true</xsl:text>\n" +
		"        </xsl:otherwise>\n" +
		"      </xsl:choose>\n" +
		"    </NonRefundable>\n" +
		"    <Origin>\n" +
		"      <xsl:value-of select=\"//SearchResult/Flights/ArrayOfFlightInfo//FlightInfo/Origin/AirportCode\"/>\n" +
		"    </Origin>\n" +
		"    <OwningPCC>\n" +
		"      <xsl:value-of select=\"''\"/>\n" +
		"    </OwningPCC>\n" +
		"    <PNR>\n" +
		"      <xsl:value-of select=\"''\"/>\n" +
		"    </PNR>\n" +
		"    <Passenger>\n" +
		"      <!--Zero or more repetitions:-->\n" +
		"      <xsl:for-each select=\"(//SearchResult/FareBreakdown/Fare)\">\n" +
		"        <xsl:variable name=\"PassengerCount\" select=\"./PassengerCount\"></xsl:variable>\n" +
		"        <xsl:variable name=\"LoopIndex\">\n" +
		"          <xsl:choose>\n" +
		"            <xsl:when test=\"./PassengerType = 'Adult'\">\n" +
		"              <xsl:text>1</xsl:text>\n" +
		"            </xsl:when>\n" +
		"            <xsl:when test=\"./PassengerType = 'Senior'\">\n" +
		"              <xsl:text>1</xsl:text>\n" +
		"            </xsl:when>\n" +
		"            <xsl:when test=\"./PassengerType = 'Child'\">\n" +
		"              <xsl:value-of select=\"../Fare[PassengerType = 'Adult']/PassengerCount + 1\"/>\n" +
		"            </xsl:when>\n" +
		"            <xsl:when test=\"./PassengerType = 'Infant'\">\n" +
		"                <xsl:choose>\n" +
		"                  <xsl:when test=\"../Fare[PassengerType = 'Child']\">\n" +
		"                    <xsl:value-of select=\"../Fare[PassengerType = 'Adult']/PassengerCount + ../Fare[PassengerType = 'Child']/PassengerCount + 1\"/>\n" +
		"                  </xsl:when>\n" +
		"                  <xsl:otherwise>\n" +
		"                    <xsl:value-of select=\"../Fare[PassengerType = 'Adult']/PassengerCount + 1\"/>\n" +
		"                  </xsl:otherwise>\n" +
		"                </xsl:choose>\n" +
		"            </xsl:when>\n" +
		"            <xsl:otherwise>\n" +
		"              <xsl:value-of select=\"(../Fare[PassengerType = 'Adult']/PassengerCount) + (../Fare[PassengerType = 'Child']/PassengerCount) + (../Fare[PassengerType = 'Child']/PassengerCount) + 1\"/>\n" +
		"            </xsl:otherwise>\n" +
		"          </xsl:choose>\n" +
		"        </xsl:variable>\n" +
		"        <xsl:call-template name=\"loop\">\n" +
		"          <xsl:with-param name=\"var\" select=\"$PassengerCount\"></xsl:with-param>\n" +
		"          <xsl:with-param name=\"loopIndex\" select=\"$LoopIndex\"></xsl:with-param>\n" +
		"        </xsl:call-template>\n" +
		"      </xsl:for-each>\n" +
		"    </Passenger>\n" +
		"    <PaymentMode>Null</PaymentMode>\n" +
		"    <PricingType>\n" +
		"      <xsl:value-of select=\"''\"/>\n" +
		"    </PricingType>\n" +
		"    <PromoCode>\n" +
		"      <xsl:value-of select=\"''\"/>\n" +
		"    </PromoCode>\n" +
		"    <ResponseParams>\n" +
		"      <xsl:copy-of select=\"$responseParams\"/>\n" +
		"    </ResponseParams>\n" +
		"    <Segments>\n" +
		"      <xsl:copy-of select=\"$segments\"/>\n" +
		"    </Segments>\n" +
		"    <xsl:if test=\"string-length(//SearchResult/SupplierSourceID) > 0\">\n" +
		"      <SupplierSourceID>\n" +
		"        <xsl:value-of select=\"//SearchResult/SupplierSourceID\"/>\n" +
		"      </SupplierSourceID>\n" +
		"    </xsl:if>\n" +
		"    <TicketAdvisory>\n" +
		"      <xsl:value-of select=\"''\"/>\n" +
		"    </TicketAdvisory>\n" +
		"    <Ticketed>false</Ticketed>\n" +
		"    <TourCode>\n" +
		"      <xsl:value-of select=\"''\"/>\n" +
		"    </TourCode>\n" +
		"    <TravelDate>\n" +
		"      <xsl:value-of select=\"//SearchResult/Flights/ArrayOfFlightInfo/FlightInfo[1]/DepartureTime\"/>\n" +
		"    </TravelDate>\n" +
		"    <ValidatingAirlineCode>\n" +
		"      <xsl:value-of select=\"//SearchResult/ValidatingAirline\"/>\n" +
		"    </ValidatingAirlineCode>\n" +
		"  </xsl:variable>\n" +
		"\n" +
		"\n" +
		"  <xsl:template name=\"loop\">\n" +
		"    <xsl:param name=\"var\"></xsl:param>\n" +
		"    <xsl:param name=\"loopIndex\"></xsl:param>\n" +
		"    <xsl:choose>\n" +
		"      <xsl:when test=\"$var > 0\">\n" +
		"        <FlightPassenger>\n" +
		"          <AddressLine1>Gurgaon</AddressLine1>\n" +
		"          <AddressLine2>Delhi</AddressLine2>\n" +
		"          <CellCountryCode>+91</CellCountryCode>\n" +
		"          <CellPhone>7799364734</CellPhone>\n" +
		"          <City>Delhi</City>\n" +
		"          <Country>\n" +
		"            <CountryCode>IN</CountryCode>\n" +
		"            <CountryName>India</CountryName>\n" +
		"            <Nationality>IN</Nationality>\n" +
		"          </Country>\n" +
		"          <xsl:variable name=\"passengerType\">\n" +
		"            <xsl:value-of select=\"./PassengerType\"/>\n" +
		"          </xsl:variable>\n" +
		"          <xsl:choose>\n" +
		"            <xsl:when test=\"$passengerType=string('Infant')\">\n" +
		"              <DateOfBirth>2025-07-01T00:00:00</DateOfBirth>\n" +
		"            </xsl:when>\n" +
		"            <xsl:when test=\"$passengerType=string('Child')\">\n" +
		"              <DateOfBirth>2020-01-01T00:00:00</DateOfBirth>\n" +
		"            </xsl:when>\n" +
		"            <xsl:when test=\"$passengerType=string('Senior')\">\n" +
		"              <DateOfBirth>1962-01-01T00:00:00</DateOfBirth>\n" +
		"            </xsl:when>\n" +
		"            <xsl:otherwise>\n" +
		"              <DateOfBirth>1990-01-01T00:00:00</DateOfBirth>\n" +
		"            </xsl:otherwise>\n" +
		"          </xsl:choose>\n" +
		"		<xsl:if test=\"$loopIndex=string('1')\">\n" +
		"            <xsl:variable name=\"FirstName\">Raju</xsl:variable>\n" +
		"            <xsl:variable name=\"LastName\">Kumar</xsl:variable>\n" +
		"		 <DocumentDetails>\n" +
		"		   <FlightPassenger.PassengerIdDetail>\n" +
		"              <DocumentIssuingCountry>IN</DocumentIssuingCountry>\n" +
		"              <IdCardType>Passport</IdCardType>\n" +
		"              <IdNumber>12345678</IdNumber>\n" +
		"              <IdNumber>" + generateRandomTimestamp() + "</IdNumber>\n" +
		"              <xsl:choose>\n" +
		"            <xsl:when test=\"$passengerType=string('Infant')\">\n" +
		"              <IdentityCardExpiryDate>" + (currentYear + 10) + "-01-01T00:00:00</IdentityCardExpiryDate>\n" +
		"              <IdentityCardIssueDate>" + (currentYear - 1) + "-01-01T00:00:00</IdentityCardIssueDate>\n" +
		"            </xsl:when>\n" +
		"            <xsl:otherwise>\n" +
		"              <IdentityCardExpiryDate>" + (currentYear + 10) + "-01-01T00:00:00</IdentityCardExpiryDate>\n" +
		"              <IdentityCardIssueDate>" + (currentYear - 5) + "-01-01T00:00:00</IdentityCardIssueDate>\n" +
		"            </xsl:otherwise>\n" +
		"          </xsl:choose>\n" +
		"		   </FlightPassenger.PassengerIdDetail>\n" +
		"		 </DocumentDetails>\n" +
		"          <Email>uapi_air_test@tbo.com</Email>\n" +
		"          <FFAirline>\n" +
		"            <xsl:value-of select=\"''\"/>\n" +
		"          </FFAirline>\n" +
		"          <FFNumber>\n" +
		"            <xsl:value-of select=\"''\"/>\n" +
		"          </FFNumber>\n" +
		"            <FirstName>\n" +
		"              <xsl:value-of select=\"$FirstName\"/>\n" +
		"            </FirstName>\n" +
		"            <FlightBoardedStatus>\n" +
		"              <!--Zero or more repetitions:-->\n" +
		"              <string>\n" +
		"                <xsl:value-of select=\"''\"/>\n" +
		"              </string>\n" +
		"            </FlightBoardedStatus>\n" +
		"            <FullName>\n" +
		"              <xsl:text>Mr</xsl:text>\n" +
		"              <xsl:value-of select=\"' '\"/>\n" +
		"              <xsl:value-of select=\"$FirstName\"/>\n" +
		"              <xsl:value-of select=\"' '\"/>\n" +
		"              <xsl:value-of select=\"$LastName\"/>\n" +
		"            </FullName>\n" +
		"            <Gender>Male</Gender>\n" +
		"            <IsLeadPax>true</IsLeadPax>\n" +
		"            <LastName>\n" +
		"              <xsl:value-of select=\"$LastName\"/>\n" +
		"            </LastName>\n" +
		"          </xsl:if>\n" +
		"          <xsl:if test=\"$loopIndex=string('2')\">\n" +
		"            <xsl:variable name=\"FirstName\">Darpan</xsl:variable>\n" +
		"            <xsl:variable name=\"LastName\">Gupta</xsl:variable>\n" +
		"		 <DocumentDetails>\n" +
		"		   <FlightPassenger.PassengerIdDetail>\n" +
		"              <DocumentIssuingCountry>IN</DocumentIssuingCountry>\n" +
		"              <IdCardType>Passport</IdCardType>\n" +
		"              <IdNumber>" + generateRandomTimestamp() + "</IdNumber>\n" +
		"              <xsl:choose>\n" +
		"            <xsl:when test=\"$passengerType=string('Infant')\">\n" +
		"              <IdentityCardExpiryDate>" + (currentYear + 10) + "-01-01T00:00:00</IdentityCardExpiryDate>\n" +
		"              <IdentityCardIssueDate>" + (currentYear - 1) + "-01-01T00:00:00</IdentityCardIssueDate>\n" +
		"            </xsl:when>\n" +
		"            <xsl:otherwise>\n" +
		"              <IdentityCardExpiryDate>" + (currentYear + 10) + "-01-01T00:00:00</IdentityCardExpiryDate>\n" +
		"              <IdentityCardIssueDate>" + (currentYear - 5) + "-01-01T00:00:00</IdentityCardIssueDate>\n" +
		"            </xsl:otherwise>\n" +
		"          </xsl:choose>\n" +
		"		   </FlightPassenger.PassengerIdDetail>\n" +
		"		 </DocumentDetails>\n" +
		"          <Email>uapi_air_test@tbo.com</Email>\n" +
		"          <FFAirline>\n" +
		"            <xsl:value-of select=\"''\"/>\n" +
		"          </FFAirline>\n" +
		"          <FFNumber>\n" +
		"            <xsl:value-of select=\"''\"/>\n" +
		"          </FFNumber>\n" +
		"            <FirstName>\n" +
		"              <xsl:value-of select=\"$FirstName\"/>\n" +
		"            </FirstName>\n" +
		"            <FlightBoardedStatus>\n" +
		"              <!--Zero or more repetitions:-->\n" +
		"              <string>\n" +
		"                <xsl:value-of select=\"''\"/>\n" +
		"              </string>\n" +
		"            </FlightBoardedStatus>\n" +
		"            <FullName>\n" +
		"              <xsl:text>Mr</xsl:text>\n" +
		"              <xsl:value-of select=\"' '\"/>\n" +
		"              <xsl:value-of select=\"$FirstName\"/>\n" +
		"              <xsl:value-of select=\"' '\"/>\n" +
		"              <xsl:value-of select=\"$LastName\"/>\n" +
		"            </FullName>\n" +
		"            <Gender>Male</Gender>\n" +
		"            <IsLeadPax>true</IsLeadPax>\n" +
		"            <LastName>\n" +
		"              <xsl:value-of select=\"$LastName\"/>\n" +
		"            </LastName>\n" +
		"          </xsl:if>\n" +
		"          <xsl:if test=\"$loopIndex=string('3')\">\n" +
		"            <xsl:variable name=\"FirstName\">Pankaj</xsl:variable>\n" +
		"            <xsl:variable name=\"LastName\">Kumar</xsl:variable>\n" +
		"		 <DocumentDetails>\n" +
		"		   <FlightPassenger.PassengerIdDetail>\n" +
		"              <DocumentIssuingCountry>IN</DocumentIssuingCountry>\n" +
		"              <IdCardType>Passport</IdCardType>\n" +
		"              <IdNumber>" + generateRandomTimestamp() + "</IdNumber>\n" +
		"              <xsl:choose>\n" +
		"            <xsl:when test=\"$passengerType=string('Infant')\">\n" +
		"              <IdentityCardExpiryDate>" + (currentYear + 10) + "-01-01T00:00:00</IdentityCardExpiryDate>\n" +
		"              <IdentityCardIssueDate>" + (currentYear - 1) + "-01-01T00:00:00</IdentityCardIssueDate>\n" +
		"            </xsl:when>\n" +
		"            <xsl:otherwise>\n" +
		"              <IdentityCardExpiryDate>" + (currentYear + 10) + "-01-01T00:00:00</IdentityCardExpiryDate>\n" +
		"              <IdentityCardIssueDate>" + (currentYear - 5) + "-01-01T00:00:00</IdentityCardIssueDate>\n" +
		"            </xsl:otherwise>\n" +
		"          </xsl:choose>\n" +
		"		   </FlightPassenger.PassengerIdDetail>\n" +
		"		 </DocumentDetails>\n" +
		"          <Email>uapi_air_test@tbo.com</Email>\n" +
		"          <FFAirline>\n" +
		"            <xsl:value-of select=\"''\"/>\n" +
		"          </FFAirline>\n" +
		"          <FFNumber>\n" +
		"            <xsl:value-of select=\"''\"/>\n" +
		"          </FFNumber>\n" +
		"            <FirstName>\n" +
		"              <xsl:value-of select=\"$FirstName\"/>\n" +
		"            </FirstName>\n" +
		"            <FlightBoardedStatus>\n" +
		"              <!--Zero or more repetitions:-->\n" +
		"              <string>\n" +
		"                <xsl:value-of select=\"''\"/>\n" +
		"              </string>\n" +
		"            </FlightBoardedStatus>\n" +
		"            <FullName>\n" +
		"              <xsl:text>Mr</xsl:text>\n" +
		"              <xsl:value-of select=\"' '\"/>\n" +
		"              <xsl:value-of select=\"$FirstName\"/>\n" +
		"              <xsl:value-of select=\"' '\"/>\n" +
		"              <xsl:value-of select=\"$LastName\"/>\n" +
		"            </FullName>\n" +
		"            <Gender>Male</Gender>\n" +
		"            <IsLeadPax>true</IsLeadPax>\n" +
		"            <LastName>\n" +
		"              <xsl:value-of select=\"$LastName\"/>\n" +
		"            </LastName>\n" +
		"          </xsl:if>\n" +
		"          <xsl:if test=\"$loopIndex=string('4')\">\n" +
		"            <xsl:variable name=\"FirstName\">Ayush</xsl:variable>\n" +
		"            <xsl:variable name=\"LastName\">Jain</xsl:variable>\n" +
		"		 <DocumentDetails>\n" +
		"		   <FlightPassenger.PassengerIdDetail>\n" +
		"              <DocumentIssuingCountry>IN</DocumentIssuingCountry>\n" +
		"              <IdCardType>Passport</IdCardType>\n" +
		"              <IdNumber>" + generateRandomTimestamp() + "</IdNumber>\n" +
		"              <xsl:choose>\n" +
		"            <xsl:when test=\"$passengerType=string('Infant')\">\n" +
		"              <IdentityCardExpiryDate>" + (currentYear + 10) + "-01-01T00:00:00</IdentityCardExpiryDate>\n" +
		"              <IdentityCardIssueDate>" + (currentYear - 1) + "-01-01T00:00:00</IdentityCardIssueDate>\n" +
		"            </xsl:when>\n" +
		"            <xsl:otherwise>\n" +
		"              <IdentityCardExpiryDate>" + (currentYear + 10) + "-01-01T00:00:00</IdentityCardExpiryDate>\n" +
		"              <IdentityCardIssueDate>" + (currentYear - 5) + "-01-01T00:00:00</IdentityCardIssueDate>\n" +
		"            </xsl:otherwise>\n" +
		"          </xsl:choose>\n" +
		"		   </FlightPassenger.PassengerIdDetail>\n" +
		"		 </DocumentDetails>\n" +
		"          <Email>uapi_air_test@tbo.com</Email>\n" +
		"          <FFAirline>\n" +
		"            <xsl:value-of select=\"''\"/>\n" +
		"          </FFAirline>\n" +
		"          <FFNumber>\n" +
		"            <xsl:value-of select=\"''\"/>\n" +
		"          </FFNumber>\n" +
		"            <FirstName>\n" +
		"              <xsl:value-of select=\"$FirstName\"/>\n" +
		"            </FirstName>\n" +
		"            <FlightBoardedStatus>\n" +
		"              <!--Zero or more repetitions:-->\n" +
		"              <string>\n" +
		"                <xsl:value-of select=\"''\"/>\n" +
		"              </string>\n" +
		"            </FlightBoardedStatus>\n" +
		"            <FullName>\n" +
		"              <xsl:text>Mr</xsl:text>\n" +
		"              <xsl:value-of select=\"' '\"/>\n" +
		"              <xsl:value-of select=\"$FirstName\"/>\n" +
		"              <xsl:value-of select=\"' '\"/>\n" +
		"              <xsl:value-of select=\"$LastName\"/>\n" +
		"            </FullName>\n" +
		"            <Gender>Male</Gender>\n" +
		"            <IsLeadPax>true</IsLeadPax>\n" +
		"            <LastName>\n" +
		"              <xsl:value-of select=\"$LastName\"/>\n" +
		"            </LastName>\n" +
		"          </xsl:if>\n" +
		"          <xsl:if test=\"$loopIndex=string('5')\">\n" +
		"            <xsl:variable name=\"FirstName\">Vishal</xsl:variable>\n" +
		"            <xsl:variable name=\"LastName\">Dua</xsl:variable>\n" +
		"		 <DocumentDetails>\n" +
		"		   <FlightPassenger.PassengerIdDetail>\n" +
		"              <DocumentIssuingCountry>IN</DocumentIssuingCountry>\n" +
		"              <IdCardType>Passport</IdCardType>\n" +
		"              <IdNumber>" + generateRandomTimestamp() + "</IdNumber>\n" +
		"              <xsl:choose>\n" +
		"            <xsl:when test=\"$passengerType=string('Infant')\">\n" +
		"              <IdentityCardExpiryDate>" + (currentYear + 10) + "-01-01T00:00:00</IdentityCardExpiryDate>\n" +
		"              <IdentityCardIssueDate>" + (currentYear - 1) + "-01-01T00:00:00</IdentityCardIssueDate>\n" +
		"            </xsl:when>\n" +
		"            <xsl:otherwise>\n" +
		"              <IdentityCardExpiryDate>" + (currentYear + 10) + "-01-01T00:00:00</IdentityCardExpiryDate>\n" +
		"              <IdentityCardIssueDate>" + (currentYear - 5) + "-01-01T00:00:00</IdentityCardIssueDate>\n" +
		"            </xsl:otherwise>\n" +
		"          </xsl:choose>\n" +
		"		   </FlightPassenger.PassengerIdDetail>\n" +
		"		 </DocumentDetails>\n" +
		"          <Email>uapi_air_test@tbo.com</Email>\n" +
		"          <FFAirline>\n" +
		"            <xsl:value-of select=\"''\"/>\n" +
		"          </FFAirline>\n" +
		"          <FFNumber>\n" +
		"            <xsl:value-of select=\"''\"/>\n" +
		"          </FFNumber>\n" +
		"            <FirstName>\n" +
		"              <xsl:value-of select=\"$FirstName\"/>\n" +
		"            </FirstName>\n" +
		"            <FlightBoardedStatus>\n" +
		"              <!--Zero or more repetitions:-->\n" +
		"              <string>\n" +
		"                <xsl:value-of select=\"''\"/>\n" +
		"              </string>\n" +
		"            </FlightBoardedStatus>\n" +
		"            <FullName>\n" +
		"              <xsl:text>Mr</xsl:text>\n" +
		"              <xsl:value-of select=\"' '\"/>\n" +
		"              <xsl:value-of select=\"$FirstName\"/>\n" +
		"              <xsl:value-of select=\"' '\"/>\n" +
		"              <xsl:value-of select=\"$LastName\"/>\n" +
		"            </FullName>\n" +
		"            <Gender>Male</Gender>\n" +
		"            <IsLeadPax>true</IsLeadPax>\n" +
		"            <LastName>\n" +
		"              <xsl:value-of select=\"$LastName\"/>\n" +
		"            </LastName>\n" +
		"          </xsl:if>\n" +
		"          <xsl:if test=\"$loopIndex=string('6')\">\n" +
		"            <xsl:variable name=\"FirstName\">Mahendra Singh</xsl:variable>\n" +
		"            <xsl:variable name=\"LastName\">Dhoni</xsl:variable>\n" +
		"		 <DocumentDetails>\n" +
		"		   <FlightPassenger.PassengerIdDetail>\n" +
		"              <DocumentIssuingCountry>IN</DocumentIssuingCountry>\n" +
		"              <IdCardType>Passport</IdCardType>\n" +
		"              <IdNumber>" + generateRandomTimestamp() + "</IdNumber>\n" +
		"              <xsl:choose>\n" +
		"            <xsl:when test=\"$passengerType=string('Infant')\">\n" +
		"              <IdentityCardExpiryDate>" + (currentYear + 10) + "-01-01T00:00:00</IdentityCardExpiryDate>\n" +
		"              <IdentityCardIssueDate>" + (currentYear - 1) + "-01-01T00:00:00</IdentityCardIssueDate>\n" +
		"            </xsl:when>\n" +
		"            <xsl:otherwise>\n" +
		"              <IdentityCardExpiryDate>" + (currentYear + 10) + "-01-01T00:00:00</IdentityCardExpiryDate>\n" +
		"              <IdentityCardIssueDate>" + (currentYear - 5) + "-01-01T00:00:00</IdentityCardIssueDate>\n" +
		"            </xsl:otherwise>\n" +
		"          </xsl:choose>\n" +
		"		   </FlightPassenger.PassengerIdDetail>\n" +
		"		 </DocumentDetails>\n" +
		"          <Email>uapi_air_test@tbo.com</Email>\n" +
		"          <FFAirline>\n" +
		"            <xsl:value-of select=\"''\"/>\n" +
		"          </FFAirline>\n" +
		"          <FFNumber>\n" +
		"            <xsl:value-of select=\"''\"/>\n" +
		"          </FFNumber>\n" +
		"            <FirstName>\n" +
		"              <xsl:value-of select=\"$FirstName\"/>\n" +
		"            </FirstName>\n" +
		"            <FlightBoardedStatus>\n" +
		"              <!--Zero or more repetitions:-->\n" +
		"              <string>\n" +
		"                <xsl:value-of select=\"''\"/>\n" +
		"              </string>\n" +
		"            </FlightBoardedStatus>\n" +
		"            <FullName>\n" +
		"              <xsl:text>Mr</xsl:text>\n" +
		"              <xsl:value-of select=\"' '\"/>\n" +
		"              <xsl:value-of select=\"$FirstName\"/>\n" +
		"              <xsl:value-of select=\"' '\"/>\n" +
		"              <xsl:value-of select=\"$LastName\"/>\n" +
		"            </FullName>\n" +
		"            <Gender>Male</Gender>\n" +
		"            <IsLeadPax>true</IsLeadPax>\n" +
		"            <LastName>\n" +
		"              <xsl:value-of select=\"$LastName\"/>\n" +
		"            </LastName>\n" +
		"          </xsl:if>\n" +
		"          <xsl:if test=\"$loopIndex=string('7')\">\n" +
		"            <xsl:variable name=\"FirstName\">Rajesh</xsl:variable>\n" +
		"            <xsl:variable name=\"LastName\">Kumar</xsl:variable>\n" +
		"		 <DocumentDetails>\n" +
		"		   <FlightPassenger.PassengerIdDetail>\n" +
		"              <DocumentIssuingCountry>IN</DocumentIssuingCountry>\n" +
		"              <IdCardType>Passport</IdCardType>\n" +
		"              <IdNumber>" + generateRandomTimestamp() + "</IdNumber>\n" +
		"              <xsl:choose>\n" +
		"            <xsl:when test=\"$passengerType=string('Infant')\">\n" +
		"              <IdentityCardExpiryDate>" + (currentYear + 10) + "-01-01T00:00:00</IdentityCardExpiryDate>\n" +
		"              <IdentityCardIssueDate>" + (currentYear - 1) + "-01-01T00:00:00</IdentityCardIssueDate>\n" +
		"            </xsl:when>\n" +
		"            <xsl:otherwise>\n" +
		"              <IdentityCardExpiryDate>" + (currentYear + 10) + "-01-01T00:00:00</IdentityCardExpiryDate>\n" +
		"              <IdentityCardIssueDate>" + (currentYear - 5) + "-01-01T00:00:00</IdentityCardIssueDate>\n" +
		"            </xsl:otherwise>\n" +
		"          </xsl:choose>\n" +
		"		   </FlightPassenger.PassengerIdDetail>\n" +
		"		 </DocumentDetails>\n" +
		"          <Email>uapi_air_test@tbo.com</Email>\n" +
		"          <FFAirline>\n" +
		"            <xsl:value-of select=\"''\"/>\n" +
		"          </FFAirline>\n" +
		"          <FFNumber>\n" +
		"            <xsl:value-of select=\"''\"/>\n" +
		"          </FFNumber>\n" +
		"            <FirstName>\n" +
		"              <xsl:value-of select=\"$FirstName\"/>\n" +
		"            </FirstName>\n" +
		"            <FlightBoardedStatus>\n" +
		"              <!--Zero or more repetitions:-->\n" +
		"              <string>\n" +
		"                <xsl:value-of select=\"''\"/>\n" +
		"              </string>\n" +
		"            </FlightBoardedStatus>\n" +
		"            <FullName>\n" +
		"              <xsl:text>Mr</xsl:text>\n" +
		"              <xsl:value-of select=\"' '\"/>\n" +
		"              <xsl:value-of select=\"$FirstName\"/>\n" +
		"              <xsl:value-of select=\"' '\"/>\n" +
		"              <xsl:value-of select=\"$LastName\"/>\n" +
		"            </FullName>\n" +
		"            <Gender>Male</Gender>\n" +
		"            <IsLeadPax>true</IsLeadPax>\n" +
		"            <LastName>\n" +
		"              <xsl:value-of select=\"$LastName\"/>\n" +
		"            </LastName>\n" +
		"          </xsl:if>\n" +
		"          <xsl:if test=\"$loopIndex=string('8')\">\n" +
		"            <xsl:variable name=\"FirstName\">Manisha</xsl:variable>\n" +
		"            <xsl:variable name=\"LastName\">Gupta</xsl:variable>\n" +
		"		 <DocumentDetails>\n" +
		"		   <FlightPassenger.PassengerIdDetail>\n" +
		"              <DocumentIssuingCountry>IN</DocumentIssuingCountry>\n" +
		"              <IdCardType>Passport</IdCardType>\n" +
		"              <IdNumber>" + generateRandomTimestamp() + "</IdNumber>\n" +
		"              <xsl:choose>\n" +
		"            <xsl:when test=\"$passengerType=string('Infant')\">\n" +
		"              <IdentityCardExpiryDate>" + (currentYear + 10) + "-01-01T00:00:00</IdentityCardExpiryDate>\n" +
		"              <IdentityCardIssueDate>" + (currentYear - 1) + "-01-01T00:00:00</IdentityCardIssueDate>\n" +
		"            </xsl:when>\n" +
		"            <xsl:otherwise>\n" +
		"              <IdentityCardExpiryDate>" + (currentYear + 10) + "-01-01T00:00:00</IdentityCardExpiryDate>\n" +
		"              <IdentityCardIssueDate>" + (currentYear - 5) + "-01-01T00:00:00</IdentityCardIssueDate>\n" +
		"            </xsl:otherwise>\n" +
		"          </xsl:choose>\n" +
		"		   </FlightPassenger.PassengerIdDetail>\n" +
		"		 </DocumentDetails>\n" +
		"          <Email>uapi_air_test@tbo.com</Email>\n" +
		"          <FFAirline>\n" +
		"            <xsl:value-of select=\"''\"/>\n" +
		"          </FFAirline>\n" +
		"          <FFNumber>\n" +
		"            <xsl:value-of select=\"''\"/>\n" +
		"          </FFNumber>\n" +
		"            <FirstName>\n" +
		"              <xsl:value-of select=\"$FirstName\"/>\n" +
		"            </FirstName>\n" +
		"            <FlightBoardedStatus>\n" +
		"              <!--Zero or more repetitions:-->\n" +
		"              <string>\n" +
		"                <xsl:value-of select=\"''\"/>\n" +
		"              </string>\n" +
		"            </FlightBoardedStatus>\n" +
		"            <FullName>\n" +
		"              <xsl:text>Ms</xsl:text>\n" +
		"              <xsl:value-of select=\"' '\"/>\n" +
		"              <xsl:value-of select=\"$FirstName\"/>\n" +
		"              <xsl:value-of select=\"' '\"/>\n" +
		"              <xsl:value-of select=\"$LastName\"/>\n" +
		"            </FullName>\n" +
		"            <Gender>Female</Gender>\n" +
		"            <IsLeadPax>true</IsLeadPax>\n" +
		"            <LastName>\n" +
		"              <xsl:value-of select=\"$LastName\"/>\n" +
		"            </LastName>\n" +
		"          </xsl:if>\n" +
		"          <xsl:if test=\"$loopIndex=string('9')\">\n" +
		"            <xsl:variable name=\"FirstName\">Virat</xsl:variable>\n" +
		"            <xsl:variable name=\"LastName\">Kohli</xsl:variable>\n" +
		"		 <DocumentDetails>\n" +
		"		   <FlightPassenger.PassengerIdDetail>\n" +
		"              <DocumentIssuingCountry>IN</DocumentIssuingCountry>\n" +
		"              <IdCardType>Passport</IdCardType>\n" +
		"              <IdNumber>" + generateRandomTimestamp() + "</IdNumber>\n" +
		"              <xsl:choose>\n" +
		"            <xsl:when test=\"$passengerType=string('Infant')\">\n" +
		"              <IdentityCardExpiryDate>" + (currentYear + 10) + "-01-01T00:00:00</IdentityCardExpiryDate>\n" +
		"              <IdentityCardIssueDate>" + (currentYear - 1) + "-01-01T00:00:00</IdentityCardIssueDate>\n" +
		"            </xsl:when>\n" +
		"            <xsl:otherwise>\n" +
		"              <IdentityCardExpiryDate>" + (currentYear + 10) + "-01-01T00:00:00</IdentityCardExpiryDate>\n" +
		"              <IdentityCardIssueDate>" + (currentYear - 5) + "-01-01T00:00:00</IdentityCardIssueDate>\n" +
		"            </xsl:otherwise>\n" +
		"          </xsl:choose>\n" +
		"		   </FlightPassenger.PassengerIdDetail>\n" +
		"		 </DocumentDetails>\n" +
		"          <Email>uapi_air_test@tbo.com</Email>\n" +
		"          <FFAirline>\n" +
		"            <xsl:value-of select=\"''\"/>\n" +
		"          </FFAirline>\n" +
		"          <FFNumber>\n" +
		"            <xsl:value-of select=\"''\"/>\n" +
		"          </FFNumber>\n" +
		"            <FirstName>\n" +
		"              <xsl:value-of select=\"$FirstName\"/>\n" +
		"            </FirstName>\n" +
		"            <FlightBoardedStatus>\n" +
		"              <!--Zero or more repetitions:-->\n" +
		"              <string>\n" +
		"                <xsl:value-of select=\"''\"/>\n" +
		"              </string>\n" +
		"            </FlightBoardedStatus>\n" +
		"            <FullName>\n" +
		"              <xsl:text>Mr</xsl:text>\n" +
		"              <xsl:value-of select=\"' '\"/>\n" +
		"              <xsl:value-of select=\"$FirstName\"/>\n" +
		"              <xsl:value-of select=\"' '\"/>\n" +
		"              <xsl:value-of select=\"$LastName\"/>\n" +
		"            </FullName>\n" +
		"            <Gender>Male</Gender>\n" +
		"            <IsLeadPax>true</IsLeadPax>\n" +
		"            <LastName>\n" +
		"              <xsl:value-of select=\"$LastName\"/>\n" +
		"            </LastName>\n" +
		"          </xsl:if>\n" +
		"          <Meal />\n" +
		"          <Nationality>\n" +
		"            <CountryCode>IN</CountryCode>\n" +
		"            <CountryName>India</CountryName>\n" +
		"            <Nationality>IN</Nationality>\n" +
		"          </Nationality>\n" +
		"          <PassportExpiry>2030-12-31T00:00:00</PassportExpiry>\n" +
		"          <PassportIssueCity>Delhi</PassportIssueCity>\n" +
		"          <PassportIssueCountryCode>IN</PassportIssueCountryCode>\n" +
		"          <PassportIssueDate>2020-12-31T00:00:00</PassportIssueDate>\n" +
		"          <PassportNo></PassportNo>\n" +
		"          <PaxBaggage>\n" +
		"            <xsl:value-of select=\"''\"/>\n" +
		"          </PaxBaggage>\n" +
		"          <PaxKey>KUMARRAJUMR</PaxKey>\n" +
		"          <PaxMeal>\n" +
		"            <xsl:value-of select=\"''\"/>\n" +
		"          </PaxMeal>\n" +
		"          <PaxSeat>\n" +
		"            <xsl:value-of select=\"''\"/>\n" +
		"          </PaxSeat>\n" +
		"          <PhoneDetails>\n" +
		"            <PhoneNumberDetails>\n" +
		"              <AreaCode>12332</AreaCode>\n" +
		"              <Extension>3322</Extension>\n" +
		"              <InternationalCode>0044</InternationalCode>\n" +
		"              <Number>232223</Number>\n" +
		"              <PhoneType>Mobile</PhoneType>\n" +
		"            </PhoneNumberDetails>\n" +
		"          </PhoneDetails>\n" +
		"          <PostalCode>110006</PostalCode>\n" +
		"          <Price>\n" +
		"            <AccPriceType>PublishedFare</AccPriceType>\n" +
		"            <AdditionalTxnFee>0</AdditionalTxnFee>\n" +
		"            <AirlineBaggageCharges>0</AirlineBaggageCharges>\n" +
		"            <AirlineMealCharges>0</AirlineMealCharges>\n" +
		"            <AirlineSSRCharges>0</AirlineSSRCharges>\n" +
		"            <AirlineSeatCharges>0</AirlineSeatCharges>\n" +
		"            <Currency>\n" +
		"              <xsl:value-of select=\"$currency\"/>\n" +
		"            </Currency>\n" +
		"            <Markup>0</Markup>\n" +
		"            <NetFare>0</NetFare>\n" +
		"            <OtherCharges>0</OtherCharges>\n" +
		"            <PublishedFare>\n" +
		"              <xsl:value-of select=\"(./BaseFare)div(./PassengerCount)\"/>\n" +
		"            </PublishedFare>\n" +
		"            <RateOfExchange>1</RateOfExchange>\n" +
		"            <Tax>\n" +
		"              <xsl:value-of select=\"(./Tax)div(./PassengerCount)\"/>\n" +
		"            </Tax>\n" +
		"            <TransactionFee>0</TransactionFee>\n" +
		"            <YQTax>0</YQTax>\n" +
		"          </Price>\n" +
		"          <Seat />\n"
		+ "			<SegmentDetails>\r\n"
		+ "				<xsl:for-each select=\"SegmentDetails/SegmentDetails\">\r\n"
		+ "					<SegmentDetails>\r\n"
		+ "						<xsl:if test=\"CabinBaggage/Value != ''\">\r\n"
		+ "							<CabinBaggage>\r\n"
		+ "								<FreeText>\r\n"
		+ "									<xsl:value-of select=\"CabinBaggage/FreeText\"/>\r\n"
		+ "								</FreeText>\r\n"
		+ "								<NoOfPiece>\r\n"
		+ "									<xsl:value-of select=\"CabinBaggage/NoOfPiece\"/>\r\n"
		+ "								</NoOfPiece>\r\n"
		+ "								<Unit>\r\n"
		+ "									<xsl:value-of select=\"CabinBaggage/Unit\"/>\r\n"
		+ "								</Unit>\r\n"
		+ "								<Value>\r\n"
		+ "									<xsl:value-of select=\"CabinBaggage/Value\"/>\r\n"
		+ "								</Value>\r\n"
		+ "							</CabinBaggage>\r\n"
		+ "						</xsl:if>\r\n"
		+ "						<xsl:if test=\"CheckedInBaggage/Value != ''\">\r\n"
		+ "							<CheckedInBaggage>\r\n"
		+ "								<FreeText>\r\n"
		+ "									<xsl:value-of select=\"CheckedInBaggage/FreeText\"/>\r\n"
		+ "								</FreeText>\r\n"
		+ "								<NoOfPiece>\r\n"
		+ "									<xsl:value-of select=\"CheckedInBaggage/NoOfPiece\"/>\r\n"
		+ "								</NoOfPiece>\r\n"
		+ "								<Unit>\r\n"
		+ "									<xsl:value-of select=\"CheckedInBaggage/Unit\"/>\r\n"
		+ "								</Unit>\r\n"
		+ "								<Value>\r\n"
		+ "									<xsl:value-of select=\"CheckedInBaggage/Value\"/>\r\n"
		+ "								</Value>\r\n"
		+ "							</CheckedInBaggage>\r\n"
		+ "						</xsl:if>\r\n"
		+ "						<FareBasis>\r\n"
		+ "							<xsl:value-of select=\"FareBasis\"/>\r\n"
		+ "						</FareBasis>\r\n"
		+ "						<SegRef>\r\n"
		+ "							<xsl:value-of select=\"SegRef\"/>\r\n"
		+ "						</SegRef>\r\n"
		+ "					</SegmentDetails>\r\n"
		+ "				</xsl:for-each>\r\n"
		+ "			</SegmentDetails>\r\n" +
		"          <TicketNumber>\n" +
		"            <xsl:value-of select=\"''\"/>\n" +
		"          </TicketNumber>\n" +
		"          <Title>Mr</Title>\n" +
		"          <Type>\n" +
		"            <xsl:value-of select=\"./PassengerType\"/>\n" +
		"          </Type>\n" +
		"        </FlightPassenger>\n" +
		"        <xsl:call-template name=\"loop\">\n" +
		"          <xsl:with-param name=\"var\">\n" +
		"            <xsl:number value=\"number($var)-1\" />\n" +
		"          </xsl:with-param>\n" +
		"          <xsl:with-param name=\"loopIndex\" select=\"$loopIndex + 1\"></xsl:with-param>\n" +
		"        </xsl:call-template>\n" +
		"      </xsl:when>\n" +
		"    </xsl:choose>\n" +
		"  </xsl:template>\n" +
		"\n" +
		"\n" +
		"  <xsl:template match=\"/\">\n" +
		"    <FlightItinerary>\n" +
		"      <xsl:copy-of select=\"$FinalOutput\"/>\n" +
		"    </FlightItinerary>\n" +
		"  </xsl:template>\n" +
		"\n" +
		"  <xsl:template match=\"@* | node()\">\n" +
		"    <xsl:copy>\n" +
		"      <xsl:apply-templates select=\"@* | node()\"/>\n" +
		"    </xsl:copy>\n" +
		"  </xsl:template>\n" +
		"</xsl:stylesheet>",
	FarequoteXslt: ""
		+ "<xsl:stylesheet version=\"1.0\" xmlns:xsl=\"http://www.w3.org/1999/XSL/Transform\"\r\n"
		+ "    xmlns:msxsl=\"urn:schemas-microsoft-com:xslt\" exclude-result-prefixes=\"msxsl\"\r\n"
		+ ">\r\n"
		+ "  <xsl:output method=\"xml\" indent=\"yes\"/>\r\n"
		+ "\r\n"
		+ "  <xsl:variable name=\"FareRules\">\r\n"
		+ "    <FareRules>\r\n"
		+ "      <xsl:for-each select=\"//SearchResult/FareRules/FareRule\">\r\n"
		+ "        <FareRule>\r\n"
		+ "          <Airline>\r\n"
		+ "            <xsl:value-of select=\"Airline\"/>\r\n"
		+ "          </Airline>\r\n"
		+ "          <xsl:if test=\"string-length(DepartureTime) &gt; 0\">\r\n"
		+ "            <DepartureTime>\r\n"
		+ "              <xsl:value-of select=\"DepartureTime\"/>\r\n"
		+ "            </DepartureTime>\r\n"
		+ "          </xsl:if>\r\n"
		+ "          <Destination>\r\n"
		+ "            <xsl:value-of select=\"Destination\"/>\r\n"
		+ "          </Destination>\r\n"
		+ "          <FareBasisCode>\r\n"
		+ "            <xsl:value-of select=\"FareBasisCode\"/>\r\n"
		+ "          </FareBasisCode>\r\n"
		+ "			<FareRestriction>\r\n"
		+ "				<xsl:value-of select=\"FareRestriction\"/>\r\n"
		+ "			</FareRestriction>\r\n"
		+ "			<FareRuleIndex>\r\n"
		+ "				<xsl:value-of select=\"FareRuleIndex\"/>\r\n"
		+ "			</FareRuleIndex>\r\n"
		+ "			<JourneyId>\r\n"
		+ "				<xsl:value-of select=\"JourneyId\"/>\r\n"
		+ "			</JourneyId>\r\n"
		+ "          <Origin>\r\n"
		+ "            <xsl:value-of select=\"Origin\"/>\r\n"
		+ "          </Origin>\r\n"
		+ "        </FareRule>\r\n"
		+ "      </xsl:for-each>\r\n"
		+ "    </FareRules>\r\n"
		+ "  </xsl:variable>\r\n"
		+ "\r\n"
		+ "  <xsl:variable name=\"FareBreakdown\">\r\n"
		+ "    <FareBreakdown>\r\n"
		+ "      <xsl:for-each select=\"//SearchResult/FareBreakdown/Fare\">\r\n"
		+ "        <Fare>\r\n"
		+ "          <AdditionalTxnFee>\r\n"
		+ "            <xsl:choose>\r\n"
		+ "              <xsl:when test=\"AdditionalTxnFee &gt; 0\">\r\n"
		+ "                <xsl:value-of select=\"AdditionalTxnFee\"/>\r\n"
		+ "              </xsl:when>\r\n"
		+ "              <xsl:otherwise>0</xsl:otherwise>\r\n"
		+ "            </xsl:choose>\r\n"
		+ "          </AdditionalTxnFee>\r\n"
		+ "          <AirlineTransFee>0</AirlineTransFee>\r\n"
		+ "          <BaseFare>\r\n"
		+ "            <xsl:value-of select=\"BaseFare\"/>\r\n"
		+ "          </BaseFare>\r\n"
		+ "<xsl:choose>\r\n"
		+ "    <xsl:when test=\"number(Commission) > 0\">\r\n"
		+ "        <Commission>\r\n"
		+ "            <xsl:value-of select=\"Commission\"/>\r\n"
		+ "        </Commission>\r\n"
		+ "    </xsl:when>\r\n"
		+ "    <xsl:otherwise>\r\n"
		+ "        <Commission>0</Commission>\r\n"
		+ "    </xsl:otherwise>\r\n"
		+ "</xsl:choose>\r\n"
		+ "<xsl:choose>\r\n"
		+ "    <xsl:when test=\"number(Discount) > 0\">\r\n"
		+ "        <Discount>\r\n"
		+ "            <xsl:value-of select=\"Discount\"/>\r\n"
		+ "        </Discount>\r\n"
		+ "    </xsl:when>\r\n"
		+ "    <xsl:otherwise>\r\n"
		+ "        <Discount>0</Discount>\r\n"
		+ "    </xsl:otherwise>\r\n"
		+ "</xsl:choose>\r\n"
		+ "<xsl:choose>\r\n"
		+ "    <xsl:when test=\"number(Incentive) > 0\">\r\n"
		+ "        <Incentive>\r\n"
		+ "            <xsl:value-of select=\"Incentive\"/>\r\n"
		+ "        </Incentive>\r\n"
		+ "    </xsl:when>\r\n"
		+ "    <xsl:otherwise>\r\n"
		+ "        <Incentive>0</Incentive>\r\n"
		+ "    </xsl:otherwise>\r\n"
		+ "</xsl:choose>\r\n"
		+ "<xsl:choose>\r\n"
		+ "    <xsl:when test=\"number(PLBAmount) > 0\">\r\n"
		+ "        <PLBAmount>\r\n"
		+ "            <xsl:value-of select=\"PLBAmount\"/>\r\n"
		+ "        </PLBAmount>\r\n"
		+ "    </xsl:when>\r\n"
		+ "    <xsl:otherwise>\r\n"
		+ "        <PLBAmount>0</PLBAmount>\r\n"
		+ "    </xsl:otherwise>\r\n"
		+ "</xsl:choose>\r\n"
		+ "          <PassengerCount>\r\n"
		+ "            <xsl:value-of select=\"PassengerCount\"/>\r\n"
		+ "          </PassengerCount>\r\n"
		+ "          <PassengerType>\r\n"
		+ "            <xsl:value-of select=\"PassengerType\"/>\r\n"
		+ "          </PassengerType>\r\n"
		+ "			<SegmentDetails>\r\n"
		+ "				<xsl:for-each select=\"SegmentDetails/SegmentDetails\">\r\n"
		+ "					<SegmentDetails>\r\n"
		+ "						<xsl:if test=\"CabinBaggage/Value != ''\">\r\n"
		+ "							<CabinBaggage>\r\n"
		+ "								<FreeText>\r\n"
		+ "									<xsl:value-of select=\"CabinBaggage/FreeText\"/>\r\n"
		+ "								</FreeText>\r\n"
		+ "								<NoOfPiece>\r\n"
		+ "									<xsl:value-of select=\"CabinBaggage/NoOfPiece\"/>\r\n"
		+ "								</NoOfPiece>\r\n"
		+ "								<Unit>\r\n"
		+ "									<xsl:value-of select=\"CabinBaggage/Unit\"/>\r\n"
		+ "								</Unit>\r\n"
		+ "								<Value>\r\n"
		+ "									<xsl:value-of select=\"CabinBaggage/Value\"/>\r\n"
		+ "								</Value>\r\n"
		+ "							</CabinBaggage>\r\n"
		+ "						</xsl:if>\r\n"
		+ "						<xsl:if test=\"CheckedInBaggage/Value != ''\">\r\n"
		+ "							<CheckedInBaggage>\r\n"
		+ "								<FreeText>\r\n"
		+ "									<xsl:value-of select=\"CheckedInBaggage/FreeText\"/>\r\n"
		+ "								</FreeText>\r\n"
		+ "								<NoOfPiece>\r\n"
		+ "									<xsl:value-of select=\"CheckedInBaggage/NoOfPiece\"/>\r\n"
		+ "								</NoOfPiece>\r\n"
		+ "								<Unit>\r\n"
		+ "									<xsl:value-of select=\"CheckedInBaggage/Unit\"/>\r\n"
		+ "								</Unit>\r\n"
		+ "								<Value>\r\n"
		+ "									<xsl:value-of select=\"CheckedInBaggage/Value\"/>\r\n"
		+ "								</Value>\r\n"
		+ "							</CheckedInBaggage>\r\n"
		+ "						</xsl:if>\r\n"
		+ "						<FareBasis>\r\n"
		+ "							<xsl:value-of select=\"FareBasis\"/>\r\n"
		+ "						</FareBasis>\r\n"
		+ "						<SegRef>\r\n"
		+ "							<xsl:value-of select=\"SegRef\"/>\r\n"
		+ "						</SegRef>\r\n"
		+ "					</SegmentDetails>\r\n"
		+ "				</xsl:for-each>\r\n"
		+ "			</SegmentDetails>\r\n"
		+ "          <Tax>\r\n"
		+ "            <!--<xsl:value-of select=\"Tax\"/>-->\r\n"
		+ "            <xsl:value-of select=\"sum(TaxList/TaxBreakUp/Amount)\"/>\r\n"
		+ "          </Tax>\r\n"
		+ "          <TaxList>\r\n"
		+ "            <xsl:if test=\"count(TaxList/TaxBreakUp) &gt; 0\">\r\n"
		+ "              <xsl:for-each select=\"TaxList/TaxBreakUp\">\r\n"
		+ "                <TaxBreakUp>\r\n"
		+ "                  <Amount>\r\n"
		+ "                    <xsl:value-of select=\"Amount\"/>\r\n"
		+ "                  </Amount>\r\n"
		+ "                  <TaxType>\r\n"
		+ "                    <xsl:value-of select=\"TaxType\"/>\r\n"
		+ "                  </TaxType>\r\n"
		+ "                </TaxBreakUp>\r\n"
		+ "              </xsl:for-each>\r\n"
		+ "            </xsl:if>\r\n"
		+ "          </TaxList>\r\n"
		+ "          <TotalFare>\r\n"
		+ "            <xsl:value-of select=\"TotalFare\"/>\r\n"
		+ "          </TotalFare>\r\n"
		+ "          <xsl:choose>\r\n"
		+ "            <xsl:when test=\"YQTax &gt; 0\">\r\n"
		+ "              <YQTax>\r\n"
		+ "                <xsl:value-of select=\"YQTax\"/>\r\n"
		+ "              </YQTax>\r\n"
		+ "            </xsl:when>\r\n"
		+ "            <xsl:otherwise>\r\n"
		+ "              <YQTax>0</YQTax>\r\n"
		+ "            </xsl:otherwise>\r\n"
		+ "          </xsl:choose>\r\n"
		+ "        </Fare>\r\n"
		+ "      </xsl:for-each>\r\n"
		+ "    </FareBreakdown>\r\n"
		+ "  </xsl:variable>\r\n"
		+ "\r\n"
		+ "  <xsl:variable name=\"Flights\">\r\n"
		+ "    <xsl:for-each select=\"//SearchResult/Flights/ArrayOfFlightInfo\">\r\n"
		+ "      <ArrayOfFlightInfo>\r\n"
		+ "        <xsl:for-each select=\"./FlightInfo\">\r\n"
		+ "          <FlightInfo>\r\n"
		+ "            <xsl:choose>\r\n"
		+ "              <xsl:when test=\"AccumulatedDurationTicks &gt; 0\">\r\n"
		+ "                <AccumulatedDurationTicks>\r\n"
		+ "                  <xsl:value-of select=\"AccumulatedDurationTicks\"/>\r\n"
		+ "                </AccumulatedDurationTicks>\r\n"
		+ "              </xsl:when>\r\n"
		+ "            </xsl:choose>\r\n"
		+ "            <Airline>\r\n"
		+ "              <xsl:value-of select=\"Airline\"/>\r\n"
		+ "            </Airline>\r\n"
		+ "            <!--Optional:-->\r\n"
		+ "            <xsl:choose>\r\n"
		+ "              <xsl:when test=\"ArrTerminal &gt; 0 or ArrTerminal!=string('')\">\r\n"
		+ "                <ArrTerminal>\r\n"
		+ "                  <xsl:value-of select=\"ArrTerminal\"/>\r\n"
		+ "                </ArrTerminal>\r\n"
		+ "              </xsl:when>\r\n"
		+ "            </xsl:choose>\r\n"
		+ "            <ArrivalTime>\r\n"
		+ "              <xsl:value-of select=\"ArrivalTime\"/>\r\n"
		+ "            </ArrivalTime>\r\n"
		+ "            <Baggage>\r\n"
		+ "              <xsl:value-of select=\"Baggage\"/>\r\n"
		+ "            </Baggage>\r\n"
		+ "            <BookingClass>\r\n"
		+ "              <xsl:value-of select=\"BookingClass\"/>\r\n"
		+ "            </BookingClass>\r\n"
		+ "            <xsl:choose>\r\n"
		+ "              <xsl:when test=\"CabinBaggage &gt; 0 or CabinBaggage!=string('')\">\r\n"
		+ "                <CabinBaggage>\r\n"
		+ "                  <xsl:value-of select=\"CabinBaggage\"/>\r\n"
		+ "                </CabinBaggage>\r\n"
		+ "              </xsl:when>\r\n"
		+ "            </xsl:choose>\r\n"
		+ "            <!--Optional:-->\r\n"
		+ "            <xsl:choose>\r\n"
		+ "              <xsl:when test=\"CabinClass &gt; 0 or CabinClass!=string('')\">\r\n"
		+ "                <CabinClass>\r\n"
		+ "                  <xsl:value-of select=\"CabinClass\"/>\r\n"
		+ "                </CabinClass>\r\n"
		+ "              </xsl:when>\r\n"
		+ "            </xsl:choose>\r\n"
		+ "            <!--Optional:-->\r\n"
		+ "            <xsl:choose>\r\n"
		+ "              <xsl:when test=\"ConjunctionNo &gt; 0\">\r\n"
		+ "                <ConjunctionNo>\r\n"
		+ "                  <xsl:value-of select=\"ConjunctionNo\"/>\r\n"
		+ "                </ConjunctionNo>\r\n"
		+ "              </xsl:when>\r\n"
		+ "            </xsl:choose>\r\n"
		+ "            <xsl:choose>\r\n"
		+ "              <xsl:when test=\"Craft &gt; 0 or Craft!=string('')\">\r\n"
		+ "                <Craft>\r\n"
		+ "                  <xsl:value-of select=\"Craft\"/>\r\n"
		+ "                </Craft>\r\n"
		+ "              </xsl:when>\r\n"
		+ "            </xsl:choose>\r\n"
		+ "            <DepTerminal>\r\n"
		+ "              <xsl:value-of select=\"DepTerminal\"/>\r\n"
		+ "            </DepTerminal>\r\n"
		+ "            <DepartureTime>\r\n"
		+ "              <xsl:value-of select=\"DepartureTime\"/>\r\n"
		+ "            </DepartureTime>\r\n"
		+ "            <Destination>\r\n"
		+ "              <AirportCode>\r\n"
		+ "                <xsl:value-of select=\"Destination/AirportCode\"/>\r\n"
		+ "              </AirportCode>\r\n"
		+ "              <AirportName>\r\n"
		+ "                <xsl:value-of select=\"Destination/AirportName\"/>\r\n"
		+ "              </AirportName>\r\n"
		+ "              <CityCode>\r\n"
		+ "                <xsl:value-of select=\"Destination/CityCode\"/>\r\n"
		+ "              </CityCode>\r\n"
		+ "              <CityName>\r\n"
		+ "                <xsl:value-of select=\"Destination/CityName\"/>\r\n"
		+ "              </CityName>\r\n"
		+ "              <CountryCode>\r\n"
		+ "                <xsl:value-of select=\"Destination/CountryCode\"/>\r\n"
		+ "              </CountryCode>\r\n"
		+ "              <CountryName>\r\n"
		+ "                <xsl:value-of select=\"Destination/CountryName\"/>\r\n"
		+ "              </CountryName>\r\n"
		+ "            </Destination>\r\n"
		+ "            <xsl:choose>\r\n"
		+ "              <xsl:when test=\"DurationTicks &gt; 0\">\r\n"
		+ "                <DurationTicks>\r\n"
		+ "                  <xsl:value-of select=\"DurationTicks\"/>\r\n"
		+ "                </DurationTicks>\r\n"
		+ "              </xsl:when>\r\n"
		+ "            </xsl:choose>\r\n"
		+ "            <ETicketEligible>true</ETicketEligible>\r\n"
		+ "            <FlightInfoIndex><xsl:value-of select=\"FlightInfoIndex\"/></FlightInfoIndex>\r\n"
		+ "            <FlightNumber>\r\n"
		+ "              <xsl:value-of select=\"FlightNumber\"/>\r\n"
		+ "            </FlightNumber>\r\n"
		+ "            <FlightRef><xsl:value-of select=\"FlightRef\"/></FlightRef>\r\n"
		+ "            <FlightStatus>Confirmed</FlightStatus>\r\n"
		+ "            <xsl:if test=\"string-length(MarriageGrpInd) > 0\">\r\n"
		+ "                <MarriageGrpInd>\r\n"
		+ "            	       <xsl:value-of select=\"MarriageGrpInd\"/>\r\n"
		+ "                </MarriageGrpInd>\r\n"
		+ "             </xsl:if>"
		+ "            <xsl:if test=\"string-length(NoOfSeatAvailable) > 0\">\r\n"
		+ "              <NoOfSeatAvailable>\r\n"
		+ "                <xsl:value-of select=\"NoOfSeatAvailable\"/>\r\n"
		+ "              </NoOfSeatAvailable>\r\n"
		+ "            </xsl:if>\r\n"
		+ "            <OperatingCarrier>\r\n"
		+ "              <xsl:value-of select=\"OperatingCarrier\"/>\r\n"
		+ "            </OperatingCarrier>\r\n"
		+ "            <Origin>\r\n"
		+ "              <AirportCode>\r\n"
		+ "                <xsl:value-of select=\"Origin/AirportCode\"/>\r\n"
		+ "              </AirportCode>\r\n"
		+ "              <AirportName>\r\n"
		+ "                <xsl:value-of select=\"Origin/AirportName\"/>\r\n"
		+ "              </AirportName>\r\n"
		+ "              <CityCode>\r\n"
		+ "                <xsl:value-of select=\"Origin/CityCode\"/>\r\n"
		+ "              </CityCode>\r\n"
		+ "              <CityName>\r\n"
		+ "                <xsl:value-of select=\"Origin/CityName\"/>\r\n"
		+ "              </CityName>\r\n"
		+ "              <CountryCode>\r\n"
		+ "                <xsl:value-of select=\"Origin/CountryCode\"/>\r\n"
		+ "              </CountryCode>\r\n"
		+ "              <CountryName>\r\n"
		+ "                <xsl:value-of select=\"Origin/CountryName\"/>\r\n"
		+ "              </CountryName>\r\n"
		+ "            </Origin>\r\n"
		+ "            <xsl:choose>\r\n"
		+ "              <xsl:when test=\"ProductClass &gt; 0 or ProductClass!=string('')\">\r\n"
		+ "                <ProductClass>\r\n"
		+ "                  <xsl:value-of select=\"ProductClass\"/>\r\n"
		+ "                </ProductClass>\r\n"
		+ "              </xsl:when>\r\n"
		+ "            </xsl:choose>\r\n"
		+ "            <xsl:if test=\"string-length(StopOver) &gt; 0\">\r\n"
		+ "              <StopOver>\r\n"
		+ "                <xsl:value-of select=\"StopOver\"/>\r\n"
		+ "              </StopOver>\r\n"
		+ "            </xsl:if>\r\n"
		+ "            <xsl:if test=\"string-length(StopPoint) &gt; 0\">\r\n"
		+ "              <StopPoint>\r\n"
		+ "                <xsl:value-of select=\"StopPoint\"/>\r\n"
		+ "              </StopPoint>\r\n"
		+ "            </xsl:if>\r\n"
		+ "            <xsl:if test=\"string-length(StopPointArrivalTime) &gt; 0\">\r\n"
		+ "              <StopPointArrivalTime>\r\n"
		+ "                <xsl:value-of select=\"StopPointArrivalTime\"/>\r\n"
		+ "              </StopPointArrivalTime>\r\n"
		+ "            </xsl:if>\r\n"
		+ "            <xsl:if test=\"string-length(StopPointDepartureTime) &gt; 0\">\r\n"
		+ "              <StopPointDepartureTime>\r\n"
		+ "                <xsl:value-of select=\"StopPointDepartureTime\"/>\r\n"
		+ "              </StopPointDepartureTime>\r\n"
		+ "            </xsl:if>\r\n"
		+ "            <xsl:if test=\"string-length(Stops) &gt; 0\">\r\n"
		+ "              <Stops>\r\n"
		+ "                <xsl:value-of select=\"Stops\"/>\r\n"
		+ "              </Stops>\r\n"
		+ "            </xsl:if>\r\n"
		+ "          </FlightInfo>\r\n"
		+ "        </xsl:for-each>\r\n"
		+ "      </ArrayOfFlightInfo>\r\n"
		+ "    </xsl:for-each>\r\n"
		+ "  </xsl:variable>\r\n"
		+ "\r\n"
		+ "  <xsl:variable name=\"FinalOutput\">\r\n"
		+ "    <Flights>\r\n"
		+ "      <xsl:copy-of select=\"$Flights\"/>\r\n"
		+ "    </Flights>\r\n"
		+ "  </xsl:variable>\r\n"
		+ "\r\n"
		+ "  <xsl:template match=\"/\">\r\n"
		+ "    <SearchResult>\r\n"
		+ "      <Airline>\r\n"
		+ "        <xsl:value-of select=\"//SearchResult/Airline\"/>\r\n"
		+ "      </Airline>\r\n"
		+ "      <AirlineRemark>\r\n"
		+ "        <xsl:value-of select=\"//SearchResult/AirlineRemark\"/>\r\n"
		+ "      </AirlineRemark>\r\n"
		+ "      <BaseFare>\r\n"
		+ "        <xsl:value-of select=\"//SearchResult/BaseFare\"/>\r\n"
		+ "      </BaseFare>\r\n"
		+ "      <BookingClass>\r\n"
		+ "        <xsl:value-of select=\"//SearchResult/Flights/ArrayOfFlightInfo/FlightInfo/BookingClass\"/>\r\n"
		+ "      </BookingClass>\r\n"
		+ "      <Currency>\r\n"
		+ "        <xsl:value-of select=\"//SearchResult/Currency\"/>\r\n"
		+ "      </Currency>\r\n"
		+ "      <EticketEligible>true</EticketEligible>\r\n"
		+ "      <xsl:copy-of select=\"$FareBreakdown\"/>\r\n"
		+ "      <FareKey>\r\n"
		+ "        <xsl:value-of select=\"//SearchResult/FareKey\"/>\r\n"
		+ "      </FareKey>\r\n"
		+ "      <xsl:copy-of select=\"$FareRules\"/>\r\n"
		+ "      <FareType>PUB</FareType>\r\n"
		+ "      <xsl:copy-of select=\"$FinalOutput\"/>\r\n"
		+ "      <IndexForScreenScrap>0</IndexForScreenScrap>\r\n"
		+ "      <xsl:if test=\"string-length(//SearchResult/IsScreenScrapped) &gt; 0\">\r\n"
		+ "        <IsScreenScrapped>\r\n"
		+ "          <xsl:value-of select=\"//SearchResult/IsScreenScrapped\"/>\r\n"
		+ "        </IsScreenScrapped>\r\n"
		+ "      </xsl:if>\r\n"
		+ "      <IssuanceType>\r\n"
		+ "        <xsl:choose>\r\n"
		+ "          <xsl:when test=\"string-length(//SearchResult/IssuanceType) &gt; 0\">\r\n"
		+ "            <xsl:value-of select=\"//SearchResult/IssuanceType\"/>\r\n"
		+ "          </xsl:when>\r\n"
		+ "          <xsl:otherwise>\r\n"
		+ "            <xsl:text>HoldAndTicket</xsl:text>\r\n"
		+ "          </xsl:otherwise>\r\n"
		+ "        </xsl:choose>\r\n"
		+ "      </IssuanceType>\r\n"
		+ "      <NonRefundable>\r\n"
		+ "        <xsl:choose>\r\n"
		+ "          <xsl:when test=\"string-length(//SearchResult/NonRefundable) &gt; 0\">\r\n"
		+ "            <xsl:value-of select=\"//SearchResult/NonRefundable\"/>\r\n"
		+ "          </xsl:when>\r\n"
		+ "          <xsl:otherwise>\r\n"
		+ "            <xsl:text>true</xsl:text>\r\n"
		+ "          </xsl:otherwise>\r\n"
		+ "        </xsl:choose>\r\n"
		+ "      </NonRefundable>\r\n"
		+ "      <Price>\r\n"
		+ "        <AccPriceType>PublishedFare</AccPriceType>\r\n"
		+ "        <AdditionalTxnFee>\r\n"
		+ "          <xsl:value-of select=\"sum(//SearchResult/FareBreakdown/Fare/AdditionalTxnFee)\"/>\r\n"
		+ "        </AdditionalTxnFee>\r\n"
		+ "        <AirlineBaggageCharges>0</AirlineBaggageCharges>\r\n"
		+ "        <AirlineMealCharges>0</AirlineMealCharges>\r\n"
		+ "        <AirlineSSRCharges>0</AirlineSSRCharges>\r\n"
		+ "        <AirlineSeatCharges>0</AirlineSeatCharges>\r\n"
		+ "        <Currency>\r\n"
		+ "          <xsl:value-of select=\"//SearchResult/Currency\"/>\r\n"
		+ "        </Currency>\r\n"
		+ "        <Markup>0</Markup>\r\n"
		+ "        <NetFare>0</NetFare>\r\n"
		+ "        <OtherCharges>0</OtherCharges>\r\n"
		+ "        <PublishedFare>\r\n"
		+ "          <xsl:value-of select=\"sum(//SearchResult/FareBreakdown/Fare/BaseFare)\"/>\r\n"
		+ "        </PublishedFare>\r\n"
		+ "        <RateOfExchange>0</RateOfExchange>\r\n"
		+ "        <Tax>\r\n"
		+ "          <xsl:value-of select=\"sum(//SearchResult/FareBreakdown/Fare/Tax)\"/>\r\n"
		+ "        </Tax>\r\n"
		+ "        <TransactionFee>0</TransactionFee>\r\n"
		+ "        <YQTax>\r\n"
		+ "          <xsl:value-of select=\"sum(//SearchResult/FareBreakdown/Fare/YQTax)\"/>\r\n"
		+ "        </YQTax>\r\n"
		+ "      </Price>\r\n"
		+ "      <PrivateResultID>1</PrivateResultID>\r\n"
		+ "      <PromoCode></PromoCode>\r\n"
		+ "      <PromoCodeWarningText></PromoCodeWarningText>\r\n"
		+ "      <ResultBookingSource>\r\n"
		+ "        <xsl:value-of select=\"//SearchResult/ResultBookingSource\"/>\r\n"
		+ "      </ResultBookingSource>\r\n"
		+ "<ResultId xmlns:arr=\"http://schemas.microsoft.com/2003/10/Serialization/Arrays\">\r\n"
		+ "    <arr:int>\r\n"
		+ "        <xsl:value-of select=\"//SearchResult/ResultId/int\"/>\r\n"
		+ "    </arr:int>\r\n"
		+ "</ResultId>\r\n"
		+ "      <xsl:if test=\"string-length(//SearchResult/SupplierSourceID) &gt; 0\">\r\n"
		+ "        <SupplierSourceID>\r\n"
		+ "          <xsl:value-of select=\"//SearchResult/SupplierSourceID\"/>\r\n"
		+ "        </SupplierSourceID>\r\n"
		+ "      </xsl:if>\r\n"
		+ "      <Tax>\r\n"
		+ "        <xsl:value-of select=\"sum(//SearchResult/FareBreakdown/Fare/Tax)\"/>\r\n"
		+ "      </Tax>\r\n"
		+ "      <TicketAdvisory></TicketAdvisory>\r\n"
		+ "      <TotalFare>\r\n"
		+ "        <xsl:value-of select=\"//SearchResult/TotalFare\"/>\r\n"
		+ "      </TotalFare>\r\n"
		+ "      <ValidatingAirline>\r\n"
		+ "        <xsl:value-of select=\"//SearchResult/ValidatingAirline\"/>\r\n"
		+ "      </ValidatingAirline>\r\n"
		+ "    </SearchResult>\r\n"
		+ "  </xsl:template>\r\n"
		+ "\r\n"
		+ "  <xsl:template match=\"@* | node()\">\r\n"
		+ "    <xsl:copy>\r\n"
		+ "      <xsl:apply-templates select=\"@* | node()\"/>\r\n"
		+ "    </xsl:copy>\r\n"
		+ "  </xsl:template>\r\n"
		+ "</xsl:stylesheet>\r\n"
		+ ""
};
