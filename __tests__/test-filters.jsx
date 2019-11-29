jest.dontMock("../filters.jsx");

import React from "react";
import TestUtils from "react-addons-test-utils";
window.$ = window.jQuery = require("jquery");
window.localStorage = window.localStorage || {};
React;

var Filters = require("../filters.jsx");

var branches = [
  { acronym: "B1", fancy_name: "Branch 1", id: "1", branch_name: "Company branch 1" },
  { acronym: "B2", fancy_name: "Branch 2", id: "2", branch_name: "Company branch 2" },
  { acronym: "B3", fancy_name: "Branch 3", id: "3", branch_name: "Company branch 3" },
  { acronym: "B4", fancy_name: "Branch 4", id: "4", branch_name: "Company branch 4" },
];

var branchFilter = TestUtils.renderIntoDocument(
  <Filters.BranchFilter attr="branch_id" branches={branches} />
);
var daterangeFilter = TestUtils.renderIntoDocument(<Filters.DaterangeFilter attr="date" />);

describe("Branch Filter", () => {
  it("builds select options correctly", () => {
    var selectOptions = branchFilter.refs.branch.refs.select.children;
    // Since 'All branches' option is added to the option by default, the
    // children count should be the branch list's length plus one.
    expect(selectOptions.length).toBe(5);

    var branchLabel = branch => `${branch.acronym} ${branch.branch_name || branch.fancy_name}`;
    var allSelectOptionsCorrect = branches.every((branch, index) => {
      return (
        selectOptions[index + 1].textContent === branchLabel(branch) &&
        selectOptions[index + 1].value === branch.id
      );
    });
    expect(allSelectOptionsCorrect).toBeTruthy();
  });

  it("builds query object and htquery string using selected branch", () => {
    branchFilter.refs.branch.refs.select.value = "2";
    expect(branchFilter.getBranchName()).toBe("B2 Company branch 2");
    expect(branchFilter.getQuery()).toEqual({ branch: "2" });
    expect(branchFilter.getHTQuery()).toBe("branch_id == '2'");
  });
});

describe("Daterange Filter", () => {
  it("set period correctly", () => {
    // Since TestUtils doesn't support 'dataChange' event from bootstrap
    // datepicker, we call the callback directly to change the dates
    $(daterangeFilter.refs.start).datepicker("update", "01/01/2001");
    daterangeFilter.set_date(0, { date: $(daterangeFilter.refs.start).datepicker("getDate") });
    $(daterangeFilter.refs.end).datepicker("update", "02/01/2001");
    daterangeFilter.set_date(1, { date: $(daterangeFilter.refs.end).datepicker("getDate") });

    expect(daterangeFilter.state.period[0].format("YYYY-MM-DD")).toBe("2001-01-01");
    expect(daterangeFilter.state.period[1].format("YYYY-MM-DD")).toBe("2001-02-01");

    daterangeFilter.refs.group.value = "month";
    TestUtils.Simulate.change(daterangeFilter.refs.group);
    // Since the group was changed, the period must be updated
    expect(daterangeFilter.state.period[0].format("YYYY-MM-DD")).toBe("2001-01-01");
    expect(daterangeFilter.state.period[1].format("YYYY-MM-DD")).toBe("2001-12-31");
  });

  it("builds Query object correctly", () => {
    expect(daterangeFilter.getQuery()).toEqual({
      start: "2001-01-01",
      end: "2001-12-31",
      group: "month",
    });
  });

  it("builds HTQuery object correctly", () => {
    expect(daterangeFilter.getHTQuery()).toEqual({
      start: "2001-01-01",
      end: "2001-12-31",
      htsql: "between(date(date), '2001-01-01', '2001-12-31')",
      group: "month",
    });
  });
});
