jest.dontMock('../search-bar.jsx');

import React from 'react';
import TestUtils from 'react-addons-test-utils';

window.$ = window.jQuery = require('jquery');
require('bootstrap');

var moment = require('moment');
var Table = require('../table.jsx');
var SearchBar = require('../search-bar.jsx');

var TestView = React.createClass({
  getInitialState: function() {
    return {hiddenColumns: []};
  },

  toggleColumn: function(column) {
    var hidden_columns = this.state.hiddenColumns;
    var column_index = hidden_columns.indexOf(column.props.getAttr());
    (column_index != -1) ? hidden_columns.splice(column_index, 1) : hidden_columns.push(column.props.getAttr());
    this.setState({hiddenColumns: hidden_columns});
  },

  getCategoryFilterSettings: function() {
    return {options: [
      {label: 'Begginer', value: 'begginer'},
      {label: 'Amateur', value: 'amateur'},
      {label: 'Professional', value: 'professional'},
    ]};
  },

  render: function() {
    return <div>
      <SearchBar ref="searchBar" table={this.refs.table} toggleColumn={this.toggleColumn}
                 defaultHTSQLFilter={(value) => {return `name ~ ${value}`;}} onSearch={jest.genMockFunction()}/>
      <Table data={[]} ref='table' hiddenColumns={this.state.hiddenColumns}>
        <Table.Column label='Name' attr='name' filter={true} data-type="alpha"/>
        <Table.Column label='Number' attr='number' filter={true} data-type="numeric" />
        <Table.Column label='Birth Date' attr='birthDate' filter={true} data-type="date"/>
        <Table.Column label='Category' attr='category' filter={true} filter-settings={this.getCategoryFilterSettings()} data-type="date"/>
      </Table>
    </div>;
  },
});

var testViewComponent = TestUtils.renderIntoDocument(<TestView/>);
var searchBarComponent = testViewComponent.refs.searchBar;
var tableComponent = testViewComponent.refs.table;
searchBarComponent.setupFilters(tableComponent);

describe('SearchBar', () => {

  it('triggers search on search button clicked', () => {
    var searchButton = searchBarComponent.refs.searchButton;
    TestUtils.Simulate.click(searchButton);
    expect(searchBarComponent.props.onSearch).toBeCalled();
  });

  it('get filters correctly', () => {
    var filters = searchBarComponent.state.filters;
    expect(filters.length).toBe(4);

    var tableColumns = tableComponent.props.children;
    var allFiltersCorrect = filters.every((filter, index) => {
      return filter.label == tableColumns[index].props.label;
    });
    expect(allFiltersCorrect).toBeTruthy();
  });

  it('toggles filters correctly', () => {
    var nameFilterButton = searchBarComponent.refs.nameFilterToggleButton;
    TestUtils.Simulate.click(nameFilterButton);
    expect(searchBarComponent.state.filters[0].visible).toBeTruthy();
    expect(searchBarComponent.refs.nameFilter.className).not.toContain('hidden');

    var nameFilterRemoveButton = searchBarComponent.refs.nameFilterRemoveButton;
    TestUtils.Simulate.click(nameFilterRemoveButton);
    expect(searchBarComponent.state.filters[0].visible).toBeFalsy();
    expect(searchBarComponent.refs.nameFilter.className).toContain('hidden');
  });

  it('builds filter queries correctly', () => {
    // Activate filters
    TestUtils.Simulate.click(searchBarComponent.refs.nameFilterToggleButton);
    TestUtils.Simulate.click(searchBarComponent.refs.numberFilterToggleButton);
    TestUtils.Simulate.click(searchBarComponent.refs.birthDateFilterToggleButton);
    TestUtils.Simulate.click(searchBarComponent.refs.categoryFilterToggleButton);

    // Set filter values
    searchBarComponent.setValue(0, null, 'Jon');
    searchBarComponent.setValue(1, null, '>3');
    searchBarComponent.setDaterange(2, {start: moment('01012001', 'DDMMYYYY'), end: moment('02022001', 'DDMMYYYY')});
    searchBarComponent.setValue(3, null, 'begginer');

    // Check Queries
    expect(searchBarComponent.getQuery()).toEqual({q: undefined, name: 'Jon', number: '>3', birthDate: '2001-01-01to2001-02-02', category: 'begginer'});
    expect(searchBarComponent.getHTQuery()).toBe("name~'Jon'&number > 3&between(date(birthDate), '2001-01-01', '2001-02-02')&category=='begginer'");

    // Deactivate filters
    TestUtils.Simulate.click(searchBarComponent.refs.nameFilterRemoveButton);
    TestUtils.Simulate.click(searchBarComponent.refs.numberFilter.children[0].children[3].children[0]);
    TestUtils.Simulate.click(searchBarComponent.refs.birthDateFilter.children[0].children[4].children[0]);
    TestUtils.Simulate.click(searchBarComponent.refs.categoryFilterRemoveButton);

    // Check Queries
    expect(searchBarComponent.getQuery()).toEqual({q: undefined});
    expect(searchBarComponent.getHTQuery()).toBe("");
  });

  it('toggles table columns correctly', () => {
    // Force component update for updating it's refs
    testViewComponent.forceUpdate();

    // Click on columns toggle buttons and test if the corresponding columns were add to hidden columns list.
    TestUtils.Simulate.click(searchBarComponent.refs.nameColumnToggle);
    TestUtils.Simulate.click(searchBarComponent.refs.numberColumnToggle);
    expect(testViewComponent.state.hiddenColumns).toEqual(['name', 'number']);

    // Click on the same buttons again and test if the columns were removed from the list
    TestUtils.Simulate.click(searchBarComponent.refs.nameColumnToggle);
    TestUtils.Simulate.click(searchBarComponent.refs.numberColumnToggle);
    expect(testViewComponent.state.hiddenColumns).toEqual([]);
  });

  it('handles numeric filter correctly', () => {
    TestUtils.Simulate.click(searchBarComponent.refs.numberFilterToggleButton);

    var numberFilterNode = searchBarComponent.refs.numberFilter.children[0];
    var firstValueInputNode = numberFilterNode.children[2];

    firstValueInputNode.value = 3;
    TestUtils.Simulate.change(firstValueInputNode);
    expect(searchBarComponent.state.filters[1].value).toBe('=3');

    numberFilterNode.children[1].children[0].children[0].value = '~';
    TestUtils.Simulate.change(numberFilterNode.children[1].children[0].children[0]);
    var secondValueInputNode = numberFilterNode.children[4];
    secondValueInputNode.value = 6;
    TestUtils.Simulate.change(secondValueInputNode);
    expect(searchBarComponent.state.filters[1].value).toBe('~3and6');

    // Close filter
    TestUtils.Simulate.click(searchBarComponent.refs.numberFilter.children[0].children[5].children[0]);
  });
});
