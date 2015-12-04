jest.dontMock('../table.jsx');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';
import Table from '../table.jsx';
window.$ = window.jQuery = require('jquery');
require('bootstrap');
React;

const dataArray = [
    {name: 'Albert', number: 6},
    {name: 'Bob', number: 5},
    {name: 'Carmen', number: 4},
    {name: 'Garfield', number: 3},
    {name: 'Naj', number: 2},
    {name: 'Ray', number: 1},
];

const basicTable = (
  <Table data={dataArray.slice()} htsql='/table' defaultOrderBy='-number' sortable={true}>
    <Table.Column label='Name' htsql='name' attr='name' data-type='alpha'/>
    <Table.Column label='Number' htsql='number' attr='number' data-type='numeric'/>
  </Table>
);

var tableComponent;

describe('Table', () => {

  it("displays 'no data' when there is no data", () => {
    tableComponent = TestUtils.renderIntoDocument(
      <Table data={[]}>
        <Table.Column label='Test Label 1'/>
        <Table.Column label='Test Label 2'/>
      </Table>
    );
    expect(tableComponent.refs.noDataDiv).not.toBeUndefined();
  });

  it("displays correct data", () => {
    tableComponent = TestUtils.renderIntoDocument(basicTable);

    // Generate table rows
    var rows = tableComponent.state.data.map(tableComponent._get_rows);
    var isEqual = rows.every(function(row, index) {
      let columns = row[0].props.children;
      return columns[0].props['data-value'] == dataArray[index].name && columns[1].props['data-value'] == dataArray[index].number;
    });
    expect(isEqual).toBeTruthy();
  });

  it("sorts data on header click", () => {
    tableComponent = TestUtils.renderIntoDocument(basicTable);

    // Simulate click on column header for sorting
    var sortButton = tableComponent.refs.NumberColumn;
    TestUtils.Simulate.click(sortButton);
    var reversedDataArray = dataArray.reverse();

    // Generate table rows
    var rows = tableComponent.state.data.map(tableComponent._get_rows);
    var isEqual = rows.every(function(row, index) {
      let columns = row[0].props.children;
      return columns[0].props['data-value'] == reversedDataArray[index].name && columns[1].props['data-value'] == reversedDataArray[index].number;
    });
    expect(isEqual).toBeTruthy();
  });

  it("builds htsql query correctly", () => {
    tableComponent = TestUtils.renderIntoDocument(basicTable);

    var filter = 'number > 3';
    expect(tableComponent.getBaseHTSQL(filter)).toBe('/table.filter(number > 3)');
    expect(tableComponent.getHTSQLAttributes()).toBe('name:=name,number:=number-');
  });

  it("doesn't render hidden columns", () => {
    tableComponent = TestUtils.renderIntoDocument(
      <Table data={[]} hiddenColumns={['number', 'gender']}>
        <Table.Column label='Name' attr='name'/>
        <Table.Column label='Number' attr='number'/>
        <Table.Column label='Gender' attr='gender'/>
      </Table>);

    var header = ReactDOM.findDOMNode(tableComponent.refs.tableHeader);
    expect(header.children.length).toBe(1);
    expect(header.children[0].textContent).toBe('Name');
  });

});
