jest.dontMock('../content.jsx');

import React from 'react';
import TestUtils from 'react-addons-test-utils';
React;

var Content = require('../content.jsx');

var contentHeaderComponent, contentComponent;

describe('Content', () => {

  beforeEach(function() {
    document.title = "Page Title";
    contentHeaderComponent = TestUtils.renderIntoDocument(
      <Content.Header title="test" subtitle="subtest"/>
    );
    contentComponent = TestUtils.renderIntoDocument(
      <Content>
        <div/>
        <div/>
      </Content>
    );
  });

  it('renders the title correctly', () => {
    let titleDiv = TestUtils.findRenderedDOMComponentWithTag(contentHeaderComponent, 'div');
    expect(titleDiv.textContent).toBe('test subtest');
  });

  it('set the page title with the content header titles', () => {
    expect(document.title).toBe('Page Title - test subtest');
  });

  it('renders the children properly', () => {
    let section = TestUtils.findRenderedDOMComponentWithClass(contentComponent, 'content');
    expect(section.children.length).toEqual(contentComponent.props.children.length);
  });

});
