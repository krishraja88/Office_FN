// import { XSLTProcessor } from 'xslt-processor';
// import { DOMParser, XMLSerializer } from 'xmldom';

document.querySelector('.btn.btn-primary').addEventListener('click',bracketRemove);
document.querySelector('.btn.btn-success').addEventListener('click', sr);
document.querySelector('.btn.btn-warning').addEventListener('click', fQTransform);
document.querySelector('.btn.btn-light').addEventListener('click', fQTransformOnly);
document.querySelector('.btn.btn-info').addEventListener('click', bookTransform);

async function bracketRemove(){
    let input = document.querySelector('.form-control.input').value;
    let output = document.querySelector('.form-control.output');

    input = input.replaceAll("&gt;", ">");
    input = input.replaceAll("&lt;", "<");
    input = input.replaceAll("&#xD;", "");
    
    // output.value = input;
    // await copySessionId();

    let firstIndex = input.indexOf("<SessionId>")+11;
    let lastIndex = input.indexOf("</SessionId>");

    await navigator.clipboard.writeText(input.substring(firstIndex, lastIndex));

    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 500ms

    output.value = input;

    await copy(); 
}

async function sr() {

    let input = document.querySelector('.form-control.input').value;
    let output = document.querySelector('.form-control.output');

    input = input.replaceAll("&gt;", ">");
    input = input.replaceAll("&lt;", "<");
    input = input.replaceAll("&#xD;", "");
    
    // output.value = input;
    // await copySessionId();
    
	let fi = input.indexOf("<SessionId>")+11;
    let li = input.indexOf("</SessionId>");

    await navigator.clipboard.writeText(input.substring(fi, li));

    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 500ms

    let firstIndex = input.indexOf("<SearchResult>");
    let lastIndex = input.indexOf("</SearchResult>") + 15;

    firstIndex!=-1 ? input = input.substring(firstIndex, lastIndex) : input = "No Search Result Found";

    output.value = input;

    await copy(); 
}

async function copy() {
    let output = document.querySelector('.form-control.output');
    await navigator.clipboard.writeText(output.value);
}

async function copySessionId()
{
    let output = document.querySelector('.form-control.output');
    let firstIndex = output.value.indexOf("<SessionId>")+11;
    let lastIndex = output.value.indexOf("</SessionId>");

    await navigator.clipboard.writeText(output.value.substring(firstIndex, lastIndex));
}

async function fQTransform(){
	await sr();

    let input = document.querySelector('.form-control.output').value;
    let output = document.querySelector('.form-control.output');

    input = transformSearch(input, "Farequote")

	await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 500ms

    output.value = input;
    await copy(); 
}

async function fQTransformOnly(){
    let input = document.querySelector('.form-control.input').value;
    let output = document.querySelector('.form-control.output');

    output.value = transformSearch(input, "Farequote")

    await copy(); 
}

async function bookTransform(){
    let input = document.querySelector('.form-control.input').value;
    let output = document.querySelector('.form-control.output');

    output.value = transformSearch(input, "Book")
	await copy();
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
					"    </ExpectedTotalFare>\n" +
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
					"              <DateOfBirth>2024-07-01T00:00:00</DateOfBirth>\n" +
					"            </xsl:when>\n" +
					"            <xsl:when test=\"$passengerType=string('Child')\">\n" +
					"              <DateOfBirth>2014-01-01T00:00:00</DateOfBirth>\n" +
					"            </xsl:when>\n" +
					"            <xsl:when test=\"$passengerType=string('Senior')\">\n" +
					"              <DateOfBirth>1962-01-01T00:00:00</DateOfBirth>\n" +
					"            </xsl:when>\n" +
					"            <xsl:otherwise>\n" +
					"              <DateOfBirth>1990-01-01T00:00:00</DateOfBirth>\n" +
					"            </xsl:otherwise>\n" +
					"          </xsl:choose>\n" +
					"          <Email>uapi_air_test@tbo.com</Email>\n" +
					"          <FFAirline>\n" +
					"            <xsl:value-of select=\"''\"/>\n" +
					"          </FFAirline>\n" +
					"          <FFNumber>\n" +
					"            <xsl:value-of select=\"''\"/>\n" +
					"          </FFNumber>\n" +
					"          <xsl:if test=\"$loopIndex=string('1')\">\n" +
					"            <xsl:variable name=\"FirstName\">Raju</xsl:variable>\n" +
					"            <xsl:variable name=\"LastName\">Kumar</xsl:variable>\n" +
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
					"            <IdDetails>\n" +
					"              <DocumentIssuingCountry>IN</DocumentIssuingCountry>\n" +
					"              <IdCardType>Passport</IdCardType>\n" +
					"              <IdNumber>12345</IdNumber>\n" +
					"              <IdentityCardExpiryDate>2035-07-01T00:00:00</IdentityCardExpiryDate>\n" +
					"              <IdentityCardIssueDate>2019-07-01T00:00:00</IdentityCardIssueDate>\n" +
					"            </IdDetails>\n" +
					"            <IsLeadPax>true</IsLeadPax>\n" +
					"            <LastName>\n" +
					"              <xsl:value-of select=\"$LastName\"/>\n" +
					"            </LastName>\n" +
					"          </xsl:if>\n" +
					"          <xsl:if test=\"$loopIndex=string('2')\">\n" +
					"            <xsl:variable name=\"FirstName\">Darpan</xsl:variable>\n" +
					"            <xsl:variable name=\"LastName\">Gupta</xsl:variable>\n" +
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
					"            <IdDetails>\n" +
					"              <DocumentIssuingCountry>IN</DocumentIssuingCountry>\n" +
					"              <IdCardType>Passport</IdCardType>\n" +
					"              <IdNumber>12346</IdNumber>\n" +
					"              <IdentityCardExpiryDate>2035-07-01T00:00:00</IdentityCardExpiryDate>\n" +
					"              <IdentityCardIssueDate>2019-07-01T00:00:00</IdentityCardIssueDate>\n" +
					"            </IdDetails>\n" +
					"            <IsLeadPax>true</IsLeadPax>\n" +
					"            <LastName>\n" +
					"              <xsl:value-of select=\"$LastName\"/>\n" +
					"            </LastName>\n" +
					"          </xsl:if>\n" +
					"          <xsl:if test=\"$loopIndex=string('3')\">\n" +
					"            <xsl:variable name=\"FirstName\">Pankaj</xsl:variable>\n" +
					"            <xsl:variable name=\"LastName\">Kumar</xsl:variable>\n" +
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
					"            <IdDetails>\n" +
					"              <DocumentIssuingCountry>IN</DocumentIssuingCountry>\n" +
					"              <IdCardType>Passport</IdCardType>\n" +
					"              <IdNumber>12347</IdNumber>\n" +
					"              <IdentityCardExpiryDate>2035-07-01T00:00:00</IdentityCardExpiryDate>\n" +
					"              <IdentityCardIssueDate>2019-07-01T00:00:00</IdentityCardIssueDate>\n" +
					"            </IdDetails>\n" +
					"            <IsLeadPax>true</IsLeadPax>\n" +
					"            <LastName>\n" +
					"              <xsl:value-of select=\"$LastName\"/>\n" +
					"            </LastName>\n" +
					"          </xsl:if>\n" +
					"          <xsl:if test=\"$loopIndex=string('4')\">\n" +
					"            <xsl:variable name=\"FirstName\">Ayush</xsl:variable>\n" +
					"            <xsl:variable name=\"LastName\">Jain</xsl:variable>\n" +
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
					"            <IdDetails>\n" +
					"              <DocumentIssuingCountry>IN</DocumentIssuingCountry>\n" +
					"              <IdNumber>12348</IdNumber>\n" +
					"              <IdentityCardExpiryDate>2035-07-01T00:00:00</IdentityCardExpiryDate>\n" +
					"              <IdentityCardIssueDate>2019-07-01T00:00:00</IdentityCardIssueDate>\n" +
					"            </IdDetails>\n" +
					"            <IsLeadPax>true</IsLeadPax>\n" +
					"            <LastName>\n" +
					"              <xsl:value-of select=\"$LastName\"/>\n" +
					"            </LastName>\n" +
					"          </xsl:if>\n" +
					"          <xsl:if test=\"$loopIndex=string('6')\">\n" +
					"            <xsl:variable name=\"FirstName\">Mahendra Singh</xsl:variable>\n" +
					"            <xsl:variable name=\"LastName\">Dhoni</xsl:variable>\n" +
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
					"            <IdDetails>\n" +
					"              <DocumentIssuingCountry>IN</DocumentIssuingCountry>\n" +
					"              <IdNumber>12349</IdNumber>\n" +
					"              <IdentityCardExpiryDate>2035-07-01T00:00:00</IdentityCardExpiryDate>\n" +
					"              <IdentityCardIssueDate>2019-07-01T00:00:00</IdentityCardIssueDate>\n" +
					"            </IdDetails>\n" +
					"            <IsLeadPax>true</IsLeadPax>\n" +
					"            <LastName>\n" +
					"              <xsl:value-of select=\"$LastName\"/>\n" +
					"            </LastName>\n" +
					"          </xsl:if>\n" +
					"          <xsl:if test=\"$loopIndex=string('7')\">\n" +
					"            <xsl:variable name=\"FirstName\">Rajesh</xsl:variable>\n" +
					"            <xsl:variable name=\"LastName\">Kumar</xsl:variable>\n" +
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
					"            <IdDetails>\n" +
					"              <DocumentIssuingCountry>IN</DocumentIssuingCountry>\n" +
					"              <IdNumber>12350</IdNumber>\n" +
					"              <IdentityCardExpiryDate>2035-07-01T00:00:00</IdentityCardExpiryDate>\n" +
					"              <IdentityCardIssueDate>2019-07-01T00:00:00</IdentityCardIssueDate>\n" +
					"            </IdDetails>\n" +
					"            <IsLeadPax>true</IsLeadPax>\n" +
					"            <LastName>\n" +
					"              <xsl:value-of select=\"$LastName\"/>\n" +
					"            </LastName>\n" +
					"          </xsl:if>\n" +
					"          <xsl:if test=\"$loopIndex=string('8')\">\n" +
					"            <xsl:variable name=\"FirstName\">Manisha</xsl:variable>\n" +
					"            <xsl:variable name=\"LastName\">Gupta</xsl:variable>\n" +
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
					"            <IdDetails>\n" +
					"              <DocumentIssuingCountry>IN</DocumentIssuingCountry>\n" +
					"              <IdNumber>12351</IdNumber>\n" +
					"              <IdentityCardExpiryDate>2035-07-01T00:00:00</IdentityCardExpiryDate>\n" +
					"              <IdentityCardIssueDate>2019-07-01T00:00:00</IdentityCardIssueDate>\n" +
					"            </IdDetails>\n" +
					"            <IsLeadPax>true</IsLeadPax>\n" +
					"            <LastName>\n" +
					"              <xsl:value-of select=\"$LastName\"/>\n" +
					"            </LastName>\n" +
					"          </xsl:if>\n" +
					"          <xsl:if test=\"$loopIndex=string('9')\">\n" +
					"            <xsl:variable name=\"FirstName\">Virat</xsl:variable>\n" +
					"            <xsl:variable name=\"LastName\">Kohli</xsl:variable>\n" +
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
					"            <IdDetails>\n" +
					"              <DocumentIssuingCountry>IN</DocumentIssuingCountry>\n" +
					"              <IdNumber>12352</IdNumber>\n" +
					"              <IdentityCardExpiryDate>2035-07-01T00:00:00</IdentityCardExpiryDate>\n" +
					"              <IdentityCardIssueDate>2019-07-01T00:00:00</IdentityCardIssueDate>\n" +
					"            </IdDetails>\n" +
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
					"          <PassportNo>123456</PassportNo>\n" +
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
					"          <Seat />\n" +
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
    		+ "          <PassengerCount>\r\n"
    		+ "            <xsl:value-of select=\"PassengerCount\"/>\r\n"
    		+ "          </PassengerCount>\r\n"
    		+ "          <PassengerType>\r\n"
    		+ "            <xsl:value-of select=\"PassengerType\"/>\r\n"
    		+ "          </PassengerType>\r\n"
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
    		+ "            <FlightInfoIndex><xsl:value-of select=\"flightinfoindex\"/></FlightInfoIndex>\r\n"
    		+ "            <FlightNumber>\r\n"
    		+ "              <xsl:value-of select=\"FlightNumber\"/>\r\n"
    		+ "            </FlightNumber>\r\n"
    		+ "            <FlightStatus>Confirmed</FlightStatus>\r\n"
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
