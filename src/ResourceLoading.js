import React from "react";

export const Context = React.createContext();

export default class ResourceLoading extends React.Component {
  state = { loading: true };

  componentDidMount() {
    this.setState({ loading: false });
  }

  componentWillUnmount() {}

  startLoading = promise => {
    this.componentWillUnmount();

    let subscribed = true;

    this.componentWillUnmount = () => {
      subscribed = false;
    };

    this.setState(state => {
      if (state.loading) return null;
      return { loading: true };
    });

    promise.then(
      () => subscribed && this.setState({ loading: false }),
      () => subscribed && this.setState({ loading: false })
    );
  };

  render() {
    return (
      <Context.Provider value={this.startLoading}>
        {this.props.children(this.state.loading)}
      </Context.Provider>
    );
  }
}
