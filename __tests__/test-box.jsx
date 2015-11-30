jest.dontMock('../box.jsx');

import React from 'react';
import TestUtils from 'react-addons-test-utils';
React;

var Box = require('../box.jsx');

var boxComponent;

describe('Box', () => {

  beforeEach(function() {
    let mockedUpdateFunction = jest.genMockFunction();

    boxComponent = TestUtils.renderIntoDocument(
      <Box title="test" onUpdate={mockedUpdateFunction} collapsible={true}>
        <div/>
      </Box>
    );
  });

  it('renders the title correctly', () => {
    let titleDiv = TestUtils.findRenderedDOMComponentWithClass(boxComponent, 'box-title');
    expect(titleDiv.textContent).toBe('test');
  });

  it('updates when update button is clicked', () => {
    let updateButton = boxComponent.refs.updateButton;
    TestUtils.Simulate.click(updateButton);
    expect(boxComponent.props.onUpdate).toBeCalled();
  });

  it('changes collapse state when collapse button is clicked', () => {
    let collapseButton = boxComponent.refs.collapseButton;
    TestUtils.Simulate.click(collapseButton);
    expect(boxComponent.state.collapsed).toBe(true);
    TestUtils.Simulate.click(collapseButton);
    expect(boxComponent.state.collapsed).toBe(false);
  });

});
