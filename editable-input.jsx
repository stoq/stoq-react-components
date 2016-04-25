import React from 'react';

var EditableInput = React.createClass({
  addClass: function(attr, klass, container, falsy) {
    klass = klass || attr;
    container = container || this.props;
    var test = falsy ? !container[attr] : container[attr];
    return test ? ' ' + klass : '';
  },

  getInput: function() {
    return this.refs.input;
  },

  toggle: function(focus) {
    focus = focus === undefined ? true : focus;
    this.setState({disabled: !this.state.disabled}, () => {
      if (!this.state.disabled && focus) {
        this.refs.input.focus();
      }
      this.props.onToggle && this.props.onToggle(!this.state.disabled);
    });
  },

  disable: function() {
    this.setState({
      disabled: true,
      dirty: false,
    });
  },

  onChange: function(event) {
    this.setState({dirty: true}, () => {
      this.props.onChange && this.props.onChange(event);
    });
  },

  componentDidMount: function() {
    if (this.props.autotoggle && this.props.userToggleable && !this.props.value) {
      this.setState({dirty: true}, this.toggle);
    }
  },

  getDefaultProps: function() {
    return {
      type: 'text',
      userToggleable: true,
      max: false,
      autotoggle: true,
      name: '',
    };
  },

  getInitialState: function() {
    return {
      disabled: true,
      dirty: false,
    };
  },

  render: function() {
    return <div className={"editable-input" + this.addClass('disabled', 'active', this.state, true)}>
      <input ref="input" className={"form-control" + this.addClass('uppercase') + this.addClass('lowercase')}
             defaultValue={this.props.value} disabled={this.state.disabled} onChange={this.onChange}
             type={this.props.type} maxLength={this.props.max} required={this.props.required}
             autoComplete="off" name={this.props.name}/>
      {!this.state.dirty && this.props.userToggleable && <i className="fa fa-pencil" onClick={this.toggle}/>}
    </div>;
  },
});

module.exports = EditableInput;
