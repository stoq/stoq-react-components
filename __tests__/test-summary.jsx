jest.dontMock('../summary.jsx');

import React from 'react';
import TestUtils from 'react-addons-test-utils';
import Utils from '../utils.jsx';
React;

var Summary = require('../summary.jsx');

var summaryData = {total: 1234.67, quantity: 1000, subquantity: 7000};
var summaryComponent = TestUtils.renderIntoDocument(
  <Summary data={summaryData}>
    <Summary.Item label='Total' attr="total" htsql="sum(sale.cost)" formatter={Utils.formatters.currency}
                  icon='fa fa-database' color='bg-green'/>
    <Summary.Item label='Quantity' attr="quantity" htsql="count(sale)" formatter={Utils.formatters.numeric}
                  sublabel='Items Quantity' subhtsql="count(sale.items)" subformatter={Utils.formatters.numeric}
                  icon='fa fa-dollar' color='bg-aqua'/>
    <div/>
  </Summary>);

describe('Summary', () => {
  it('builds htsql query correctly', () => {
    var htsql = summaryComponent.getHTSQL();
    expect(htsql).toBe('total:=sum(sale.cost),quantity:=count(sale),subquantity:=count(sale.items)');
  });

  it('render correct and formatted data', () => {
    var summaryNumberBoxes = TestUtils.scryRenderedDOMComponentsWithClass(summaryComponent, 'info-box-number');
    expect(summaryNumberBoxes[0].textContent).toBe(Utils.formatters.currency(summaryData.total));
    expect(summaryNumberBoxes[1].textContent).toBe(Utils.formatters.numeric(summaryData.quantity));
    expect(summaryNumberBoxes[2].textContent).toBe(Utils.formatters.numeric(summaryData.subquantity));
  });

  it('ignores non summary item children', () => {
    var summaryInfoBoxes = TestUtils.scryRenderedDOMComponentsWithClass(summaryComponent, 'info-box');
    expect(summaryInfoBoxes.length).toBe(2);
  });
});
