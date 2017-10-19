import BaseComponent from 'components/base';
import equals from 'base-components/utils/equals';
import AnimatedNumber from 'react-animated-number';
import Utils from 'utils';

export default class DescriptionBlock extends BaseComponent {

  static defaultProps = {
    formatter: 'numeric',
  }

  constructor(props) {
    super(props);
    this.state = {
      value: 0,
    };
  }

  componentDidMount() {
    setTimeout(() => this.setState({value: this.props.value}), 1000);
  }

  componentWillReceiveProps(props) {
    if (!equals(props.value, this.props.value)) {
      setTimeout(() => this.setState({value: props.value}), 1000);
    }
  }

  _getComparison() {
    let current = this.props.value;
    let last = this.props.last;
    if (last === current || last === undefined) {
      return (
        <span className="description-percentage text-yellow">
          <i className="fa fa-caret-left"></i>
          &nbsp;{Utils.formatters.percentage(0)}
        </span>);
    }
    let variation = Math.abs((current - last) / last);
    let color = current > last ? 'text-green' : 'text-red';
    let icon = current > last ? 'up' : 'down';
    return (
      <span className={"description-percentage " + color}>
        <i className={"fa fa-caret-" + icon}></i>
        &nbsp;{Utils.formatters.percentage(variation * 100)}
      </span>);
  }

  render() {
    return (
      <div className="description-block border-right">
        <span className="description-text"
              style={{fontWeight: '100', textTransform: 'inherit', fontSize: this.props.labelSize}}>
          { this.props.label }
        </span>
        <h3 className="description-header"
            style={{fontSize: this.props.valueSize + 'px', fontWeight: '500'}}>
          <AnimatedNumber
            style={{
              transition: '0.2s ease-out',
              transitionProperty:
                'background-color, color, opacity',
            }}
            formatValue={n => `${Utils.formatters[this.props.formatter](n)}`}
            frameStyle={perc => (perc === 100 ? {} : {opacity: 0.5})}
            value={parseFloat(this.state.value)}
            duration={500}
            stepPrecision={2}
          />
        </h3>
        {this._getComparison()}
      </div>);
  }
}
