/** @jsx h */
import { h, render, Component } from "preact";

class CountdownTimer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      endTime: null,
      timeLeft: null,
    };
    this.interval = null;
  }

  async componentDidMount() {
    // if (!window.SHOP_DOMAIN) {
    //   console.error("Shop domain not found!");
    //   this.setState({ timeLeft: "Shop domain missing" });
    //   return;
    // }
    const SHOP_DOMAIN = "helixo-machine-test.myshopify.com";
    try {
      // Fetch the active timer from your backend
      const res = await fetch(`/api/timers?shopDomain=${SHOP_DOMAIN}`);
      const timer = await res.json();

      if (timer && timer.endDate) {
        this.setState({ endTime: new Date(timer.endDate) });
        this.startCountdown();
      } else {
        this.setState({ timeLeft: "No active timer" });
      }
    } catch (err) {
      console.error("Failed to fetch timer", err);
      this.setState({ timeLeft: "Error loading timer" });
    }
  }

  startCountdown() {
    this.interval = setInterval(() => {
      const now = new Date();
      const distance = this.state.endTime - now;

      if (distance <= 0) {
        clearInterval(this.interval);
        this.setState({ timeLeft: "Expired" });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((distance / (1000 * 60)) % 60);
      const seconds = Math.floor((distance / 1000) % 60);

      this.setState({
        timeLeft: `${days > 0 ? days + "d " : ""}${hours}h ${minutes}m ${seconds}s`,
      });
    }, 1000);
  }

  componentWillUnmount() {
    if (this.interval) clearInterval(this.interval);
  }

  render() {
    return (
      <div
        style={{
          padding: "10px",
          background: "#fffae6",
          color: "#333",
          fontWeight: "bold",
          borderRadius: "5px",
          textAlign: "center",
          marginTop: "10px",
        }}
      >
        {this.state.timeLeft
          ? `Offer ends in: ${this.state.timeLeft}`
          : "Loading timer..."}
      </div>
    );
  }
}

// Mount the timer in the product card
const container = document.getElementById("timer-widget");
if (container) {
  render(<CountdownTimer />, container);
} else {
  console.error("Countdown container not found!");
}
