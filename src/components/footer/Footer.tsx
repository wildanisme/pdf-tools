import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 mb-5">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Products</h3>
          <ul className="mt-4 space-y-4">
            <li><a href="https://pospercetakan.com?utm_source=pdf.wildanisme.com" target='_blank' className="text-base text-gray-500 hover:text-gray-900 text-wrap">Aplikasi POS Percetakan</a></li>
            <li><a href="https://tatakeu.id?utm_source=pdf.wildanisme.com" target='_blank' className="text-base text-gray-500 hover:text-gray-900 text-wrap">Aplikasi Tata Keuangan Sekolah</a></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Company</h3>
          <ul className="mt-4 space-y-4">
            <li><a href="https://summitct.co.id?utm_source=pdf.wildanisme.com" target='_blank' className="text-base text-gray-500 hover:text-gray-900 text-wrap">Summit Citra Teknologi</a></li>
            <li><a href="#" className="text-base text-gray-500 hover:text-gray-900 text-wrap">Motekar Teknologi Indonesia</a></li>
            <li><a href="https://wildanisme.com" target='_blank' className="text-base text-gray-500 hover:text-gray-900 text-wrap">Wildanisme</a></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Legal</h3>
          <ul className="mt-4 space-y-4">
            <li><a href="#" className="text-base text-gray-500 hover:text-gray-900 text-wrap">Privacy Policy</a></li>
            <li><a href="#" className="text-base text-gray-500 hover:text-gray-900 text-wrap">Terms of Service</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
