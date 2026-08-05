const footerColumns = [
  {
    title: "About",
    links: ["How it works", "Safety guidelines", "Privacy policy"],
  },
  {
    title: "Community",
    links: ["For students", "Campus partners", "Blog"],
  },
  {
    title: "Support",
    links: ["Help center", "Contact us", "Report issue"],
  },
  {
    title: "Legal",
    links: ["Terms of service", "Privacy policy", "Cookie policy"],
  },
];

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-columns">
        {footerColumns.map((column) => (
          <div className="site-footer-column" key={column.title}>
            <h4>{column.title}</h4>
            <ul>
              {column.links.map((link) => (
                <li key={link}>
                  <a href="#">{link}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="site-footer-bottom">
        <p>© 2026 CampusCart. All rights reserved. Built for university students.</p>
      </div>
    </footer>
  );
}
