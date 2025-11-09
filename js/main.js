const tabItem = document.querySelectorAll('.tabs_btn-item');
const tabContent = document.querySelectorAll('.tabs_content-item');

tabItem.forEach(item => {
  item.addEventListener('click', event => {
    const button = event.currentTarget.dataset.button;


    tabItem.forEach(btn => btn.classList.remove('tabs_btn-item--active'));
    tabContent.forEach(content => content.classList.remove('tabs_content-item--active'));


    event.currentTarget.classList.add('tabs_btn-item--active');
    document.getElementById(button).classList.add('tabs_content-item--active');
  });
});

const menuBtn = document.querySelector('.menu_btn');
const menu = document.querySelector('.menu_list');

menuBtn.addEventListener('click',() => {
  menu.classList.toggle('menu_list--active');
});


const swiper = new Swiper(".swiper", {
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },
  loop: true, 
  autoplay: {
    delay: 3000, 
  },
});