import React from 'react';

const propTypes = {
  title: React.PropTypes.string.isRequired,
  type: React.PropTypes.string,
  dismissable: React.PropTypes.bool,
  children: React.PropTypes.element.isRequired,
};

const defaultProps = {
  type: "warning",
  dismissable: true,
};

/*
 * Props
 *
 * type(String) The type of the message (success, warning, danger)
 * dismissable(Boolean) True if the message is dismissable
 * title(String) The title of the message
 * content(Element) The content of the message
 */
class Message extends React.Component {
  // Initial State
  constructor(props) {
    super(props);
    this.state = {hidden: false};
  }

  onClose() {
    this.setState({hidden: true});
  }

  render() {
    let isHidden = this.state.hidden ? " hidden" : "";
    return (
      <div
        className={"alert alert-" + this.props.type + isHidden}
        style={{'marginTop': '15px'}}
      >
        {this.props.dismissable &&
          <i className="close pull-right fa fa-times"
             onClick={this.onClose}
          />}
        <h4>{this.props.title}</h4>
        <div>
          {this.props.children}
        </div>
      </div>
    );
  }
}

Message.propTypes = propTypes;
Message.defaultProps = defaultProps;

export default Message;
