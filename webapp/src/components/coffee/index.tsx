import coffee from "../../images/coffee.png";

export default function Coffee() {
  return (
    <a className="coffee-button" target="_blank" rel="noreferrer" href="https://www.buymeacoffee.com/harinwu">
      <img style={{width: 30, height: 35}} className="coffee-image" src={coffee} alt="Buy me a coffee" />
      <span style={{color: 'white', marginLeft: 10}} className="coffee-text">Enjoy this app? Buy me a coffee :)</span>
    </a>
  );
}
